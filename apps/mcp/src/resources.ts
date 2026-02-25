// Ovo — MCP Server
// Resource registrations — exposes Ovo data as readable MCP resources
// SPDX-License-Identifier: GPL-3.0

import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as api from "./api.js";
import type { Task } from "./api.js";

// ─── Helpers ─────────────────────────────────────────

function formatTaskAsText(task: Task): string {
  const lines = [
    `Title: ${task.title}`,
    `ID: ${task.id}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority}`,
    `Due: ${task.dueDate || "none"}`,
    `Description: ${task.description || "(none)"}`,
    `Created: ${task.createdAt}`,
    `Updated: ${task.updatedAt}`,
  ];
  return lines.join("\n");
}

// ─── Resource Registration ──────────────────────────

export function registerResources(server: McpServer): void {
  // ── ovo://tasks — list all tasks ──
  server.registerResource(
    "task-list",
    "ovo://tasks",
    {
      title: "All Tasks",
      description: "List of all your Ovo tasks",
      mimeType: "application/json",
    },
    async (uri) => {
      const result = await api.listTasks({ limit: 100 });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    }
  );

  // ── ovo://tasks/{taskId} — single task detail ──
  server.registerResource(
    "task-detail",
    new ResourceTemplate("ovo://tasks/{taskId}", {
      list: async () => {
        // List available tasks so clients can discover them
        try {
          const result = await api.listTasks({ limit: 100 });
          return {
            resources: result.data.map((task) => ({
              uri: `ovo://tasks/${task.id}`,
              name: task.title,
              description: `[${task.status}] [${task.priority}] ${task.description || "No description"}`,
            })),
          };
        } catch {
          return { resources: [] };
        }
      },
    }),
    {
      title: "Task Detail",
      description: "Detailed view of a specific Ovo task",
      mimeType: "text/plain",
    },
    async (uri, { taskId }) => {
      const result = await api.getTask(taskId as string);
      return {
        contents: [
          {
            uri: uri.href,
            text: formatTaskAsText(result.data),
          },
        ],
      };
    }
  );

  // ── ovo://stats — task statistics ──
  server.registerResource(
    "task-stats",
    "ovo://stats",
    {
      title: "Task Statistics",
      description: "Your Ovo task completion statistics",
      mimeType: "application/json",
    },
    async (uri) => {
      const result = await api.getStats();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    }
  );

  // ── ovo://profile — user profile ──
  server.registerResource(
    "user-profile",
    "ovo://profile",
    {
      title: "User Profile",
      description: "Your Ovo user profile",
      mimeType: "application/json",
    },
    async (uri) => {
      const result = await api.getProfile();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    }
  );

  // ── ovo://daily-summary — AI daily summary ──
  server.registerResource(
    "daily-summary",
    "ovo://daily-summary",
    {
      title: "Daily Summary",
      description: "Your AI-powered daily task summary with focus tasks and encouragement",
      mimeType: "application/json",
    },
    async (uri) => {
      try {
        const result = await api.getDailySummary();
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      } catch {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: "AI features not available" }),
            },
          ],
        };
      }
    }
  );
}
