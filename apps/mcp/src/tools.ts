// Ovo — MCP Server
// Tool registrations — exposes Ovo task management to AI assistants
// SPDX-License-Identifier: GPL-3.0

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as api from "./api.js";
import type { Task } from "./api.js";

// ─── Helpers ─────────────────────────────────────────

function formatTask(task: Task): string {
  const lines = [
    `# ${task.title}`,
    ``,
    `- **ID:** ${task.id}`,
    `- **Status:** ${task.status}`,
    `- **Priority:** ${task.priority}`,
    `- **Due:** ${task.dueDate || "none"}`,
    `- **Created:** ${task.createdAt}`,
    `- **Updated:** ${task.updatedAt}`,
  ];
  if (task.description) {
    lines.push(``, `## Description`, ``, task.description);
  }
  return lines.join("\n");
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// ─── Tool Registration ──────────────────────────────

export function registerTools(server: McpServer): void {
  // ── list_tasks ──
  server.registerTool(
    "list_tasks",
    {
      title: "List Tasks",
      description:
        "List your Ovo tasks with optional filters for status, priority, search, sorting, and pagination.",
      inputSchema: z.object({
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe("Filter by task status"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Filter by priority level"),
        search: z
          .string()
          .optional()
          .describe("Search in task title and description"),
        sortBy: z
          .enum(["createdAt", "dueDate", "priority", "title"])
          .optional()
          .describe("Field to sort by (default: createdAt)"),
        sortOrder: z
          .enum(["asc", "desc"])
          .optional()
          .describe("Sort direction (default: desc)"),
        page: z.number().int().positive().optional().describe("Page number"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Items per page (max 100)"),
      }),
    },
    async (args) => {
      try {
        const result = await api.listTasks(args);
        const tasks = result.data;
        const { pagination } = result;

        if (tasks.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No tasks found matching your filters.",
              },
            ],
          };
        }

        const header = `Found ${pagination.total} task(s) (page ${pagination.page}/${pagination.totalPages}):\n\n`;
        const taskList = tasks.map(formatTask).join("\n\n---\n\n");

        return {
          content: [{ type: "text" as const, text: header + taskList }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Error listing tasks: ${formatError(error)}` },
          ],
        };
      }
    }
  );

  // ── get_task ──
  server.registerTool(
    "get_task",
    {
      title: "Get Task",
      description: "Get the full details of a specific Ovo task by its ID.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to retrieve"),
      }),
    },
    async ({ taskId }) => {
      try {
        const result = await api.getTask(taskId);
        return {
          content: [{ type: "text" as const, text: formatTask(result.data) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Error getting task: ${formatError(error)}` },
          ],
        };
      }
    }
  );

  // ── create_task ──
  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description: "Create a new task in Ovo.",
      inputSchema: z.object({
        title: z.string().min(1).describe("Task title (required)"),
        description: z.string().optional().describe("Task description"),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe("Initial status (default: pending)"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Priority level (default: medium)"),
        dueDate: z
          .string()
          .optional()
          .describe("Due date in ISO 8601 format (e.g. 2026-03-01T00:00:00Z)"),
      }),
    },
    async (args) => {
      try {
        const result = await api.createTask(args);
        return {
          content: [
            {
              type: "text" as const,
              text: `Task created successfully!\n\n${formatTask(result.data)}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating task: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );

  // ── update_task ──
  server.registerTool(
    "update_task",
    {
      title: "Update Task",
      description:
        "Update an existing Ovo task. Only provide the fields you want to change.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to update"),
        title: z.string().min(1).optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .optional()
          .describe("New status"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("New priority"),
        dueDate: z
          .string()
          .nullable()
          .optional()
          .describe(
            "New due date (ISO 8601), or null to remove the due date"
          ),
      }),
    },
    async ({ taskId, ...updates }) => {
      try {
        const result = await api.updateTask(taskId, updates);
        return {
          content: [
            {
              type: "text" as const,
              text: `Task updated successfully!\n\n${formatTask(result.data)}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error updating task: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );

  // ── delete_task ──
  server.registerTool(
    "delete_task",
    {
      title: "Delete Task",
      description: "Permanently delete an Ovo task by its ID.",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID to delete"),
      }),
      annotations: {
        destructiveHint: true,
      },
    },
    async ({ taskId }) => {
      try {
        const result = await api.deleteTask(taskId);
        return {
          content: [
            {
              type: "text" as const,
              text: result.message || `Task ${taskId} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting task: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );

  // ── get_stats ──
  server.registerTool(
    "get_stats",
    {
      title: "Get Task Statistics",
      description:
        "Get your Ovo task completion statistics — total, pending, in progress, completed, and completion rate.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await api.getStats();
        const s = result.data;

        const text = [
          `# Task Statistics`,
          ``,
          `| Metric | Value |`,
          `|--------|-------|`,
          `| Total | ${s.total} |`,
          `| Pending | ${s.pending} |`,
          `| In Progress | ${s.inProgress} |`,
          `| Completed | ${s.completed} |`,
          `| Completion Rate | ${s.completionRate}% |`,
        ].join("\n");

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error getting stats: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );

  // ── get_daily_summary ──
  server.registerTool(
    "get_daily_summary",
    {
      title: "Get Daily Summary",
      description:
        "Get your AI-powered daily summary — tells you the top 3 tasks to focus on today, with a brief encouragement. Cached once per day.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await api.getDailySummary();
        const s = result.data;

        const lines = [
          `# Daily Summary`,
          ``,
          s.summary,
          ``,
          `## Focus Tasks`,
          ``,
        ];

        s.focusTasks.forEach((ft, i) => {
          lines.push(`${i + 1}. **${ft.title}** — ${ft.reason}`);
        });

        lines.push(``, `---`, ``, `_${s.encouragement}_`, ``, `_Generated at ${s.generatedAt}_`);

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error getting daily summary: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );

  // ── get_notification_time ──
  server.registerTool(
    "get_notification_time",
    {
      title: "Get Notification Time",
      description:
        "Get the user's preferred daily summary notification time (used by the mobile app for local push notifications).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await api.getNotificationTime();
        const { hour, minute } = result.data;
        const formatted = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

        return {
          content: [
            {
              type: "text" as const,
              text: `Daily summary notification is scheduled for **${formatted}** every day.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error getting notification time: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );

  // ── set_notification_time ──
  server.registerTool(
    "set_notification_time",
    {
      title: "Set Notification Time",
      description:
        "Set the user's preferred daily summary notification time. The mobile app will schedule local push notifications at this time.",
      inputSchema: z.object({
        hour: z
          .number()
          .int()
          .min(0)
          .max(23)
          .describe("Hour of the day (0-23)"),
        minute: z
          .number()
          .int()
          .min(0)
          .max(59)
          .describe("Minute of the hour (0-59)"),
      }),
    },
    async ({ hour, minute }) => {
      try {
        const result = await api.setNotificationTime({ hour, minute });
        const h = result.data.hour;
        const m = result.data.minute;
        const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        return {
          content: [
            {
              type: "text" as const,
              text: `Notification time updated to **${formatted}**. The mobile app will schedule notifications at this time.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error setting notification time: ${formatError(error)}`,
            },
          ],
        };
      }
    }
  );
}
