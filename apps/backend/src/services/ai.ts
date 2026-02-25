// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { ChatPromptTemplate } from "@langchain/core/prompts";
import prisma from "../lib/prisma";
import { getModel, isAIConfigured } from "../lib/llm";
import { AppError } from "../middleware/errorHandler";
import { dailySummaryResponseSchema } from "../shared";
import { TaskStatus, TaskPriority } from "@prisma/client";
import type { DailySummary } from "../shared";

// ─── Reverse enum maps (match tasks service) ─────────
const reverseStatusMap: Record<TaskStatus, string> = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

const reversePriorityMap: Record<TaskPriority, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// ─── System Prompt ───────────────────────────────────
const DAILY_SUMMARY_SYSTEM_PROMPT = `You are a productivity assistant for someone with ADHD. Your job is to look at their task list and tell them exactly what to focus on today.

Rules:
- Be concise and direct. No fluff, no filler words.
- Pick the top 3 most important tasks (fewer if they have fewer tasks).
- Prioritize by: overdue > due today > high priority > in-progress > everything else.
- For each focus task, give a short, specific reason (e.g. "Overdue by 2 days", "Due today", "High priority, in progress").
- The summary should be 1-2 sentences max — a quick snapshot of their day.
- The encouragement should be genuine and brief — one sentence. No toxic positivity.
- Use the task IDs exactly as provided.
- If the user has no actionable tasks, say so honestly.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", DAILY_SUMMARY_SYSTEM_PROMPT],
  [
    "user",
    `Today is {today}.

Here are my current tasks:
{taskList}

What should I focus on today?`,
  ],
]);

// ─── Helpers ─────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Cleanup: delete cached summaries older than 1 day.
 * Runs best-effort — failures are logged but don't block the request.
 */
async function cleanupOldCaches(): Promise<void> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cutoff = yesterday.toISOString().split("T")[0];

    await prisma.dailySummaryCache.deleteMany({
      where: { date: { lt: cutoff } },
    });
  } catch (err) {
    console.error("[Ovo AI] Cache cleanup failed (non-fatal):", err);
  }
}

// ─── Daily Summary Service ───────────────────────────

export async function getDailySummary(userId: string): Promise<DailySummary> {
  if (!isAIConfigured()) {
    throw new AppError("AI features are not configured", 503);
  }

  const today = todayDateString();

  // ── Check cache first ──
  const cached = await prisma.dailySummaryCache.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (cached) {
    return JSON.parse(cached.summary) as DailySummary;
  }

  // ── Generate fresh summary ──
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: "COMPLETED" },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  if (tasks.length === 0) {
    const empty: DailySummary = {
      summary: "You have no pending tasks. Enjoy your free time!",
      focusTasks: [],
      encouragement: "All clear — you've earned a break.",
      generatedAt: new Date().toISOString(),
    };

    // Cache even the empty response so we don't re-query the LLM
    await prisma.dailySummaryCache.create({
      data: { userId, date: today, summary: JSON.stringify(empty) },
    });

    // Best-effort cleanup
    cleanupOldCaches();

    return empty;
  }

  // Format tasks for the LLM
  const taskList = tasks
    .map((t) => {
      const status = reverseStatusMap[t.status as TaskStatus];
      const priority = reversePriorityMap[t.priority as TaskPriority];
      const due = t.dueDate
        ? `due ${t.dueDate.toISOString().split("T")[0]}`
        : "no due date";
      return `- [${t.id}] "${t.title}" (${status}, ${priority} priority, ${due})`;
    })
    .join("\n");

  // Build and invoke the chain
  const model = getModel();
  const structuredModel = model.withStructuredOutput(dailySummaryResponseSchema);
  const chain = prompt.pipe(structuredModel);

  try {
    const result = await chain.invoke({ today, taskList }) as {
      summary: string;
      focusTasks: { id: string; title: string; reason: string }[];
      encouragement: string;
    };

    const summary: DailySummary = {
      summary: result.summary,
      focusTasks: result.focusTasks,
      encouragement: result.encouragement,
      generatedAt: new Date().toISOString(),
    };

    // ── Cache the result ──
    await prisma.dailySummaryCache.create({
      data: { userId, date: today, summary: JSON.stringify(summary) },
    });

    // Best-effort cleanup of old caches
    cleanupOldCaches();

    return summary;
  } catch (err) {
    console.error("[Ovo AI] Daily summary generation failed:", err);
    throw new AppError("Failed to generate daily summary", 502);
  }
}
