// Ovo — MCP Server
// Entry point — wires up McpServer with stdio transport
// SPDX-License-Identifier: GPL-3.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

// ─── Server Setup ────────────────────────────────────

const server = new McpServer(
  {
    name: "ovo-mcp",
    version: "0.1.0",
  },
  {
    instructions: [
      "Ovo is a task manager. Use the tools to manage tasks — list, create, update, delete, and get stats.",
      "Tasks have a title, optional description, status (pending/in_progress/completed),",
      "priority (low/medium/high), and an optional due date.",
      "Use get_stats to see the user's overall task completion metrics.",
    ].join(" "),
  }
);

// Register tools and resources
registerTools(server);
registerResources(server);

// ─── Connect ─────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running — stdio transport handles the lifecycle.
  // Logs go to stderr so they don't interfere with the MCP protocol on stdout.
  console.error("Ovo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
