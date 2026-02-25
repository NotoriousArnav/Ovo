# MCP Server

The Ovo MCP server exposes your tasks to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/). Hook it up to Claude Desktop, Cursor, OpenCode, or any MCP-compatible client, and you can manage your Ovo tasks through natural language without leaving your editor.

It talks to the Ovo backend over HTTP using an API key for authentication — no direct database access.

## Prerequisites

- An **Ovo account** with at least one API key
- The backend running (locally or the production instance at `https://ovo-backend.vercel.app`)
- **Either:** a prebuilt binary (no Node.js needed), **or** Node.js >= 20 and pnpm >= 9 to build from source

## Setup

### 1. Create an API Key

You need an API key for the MCP server to authenticate with the Ovo API. You can create one from:

- **Web app** — go to Profile, scroll to "API Keys", type a name and hit Create
- **Mobile app** — go to Profile, same deal
- **curl** — if you prefer the terminal:

```bash
curl -X POST https://ovo-backend.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-access-token>" \
  -d '{ "name": "MCP Server" }'
```

The response includes the raw key (starts with `ovo_k_`). **Copy it immediately** — it's shown once and never again.

### 2. Get the MCP Server Binary

You have two options:

#### Option A: Download a prebuilt binary (no Node.js required)

Grab the latest binary for your platform from [GitHub Releases](https://github.com/NotoriousArnav/Ovo/releases):

| Platform | File |
|----------|------|
| Linux x64 | `ovo-mcp-linux-x64-<hash>` |
| Linux arm64 | `ovo-mcp-linux-arm64-<hash>` |
| macOS Apple Silicon | `ovo-mcp-darwin-arm64-<hash>` |
| macOS Intel | `ovo-mcp-darwin-x64-<hash>` |
| Windows x64 | `ovo-mcp-win-x64-<hash>.exe` |
| Windows arm64 | `ovo-mcp-win-arm64-<hash>.exe` |

On Linux/macOS, make it executable after downloading:

```bash
chmod +x ovo-mcp-linux-x64-*
```

#### Option B: Build from source

```bash
pnpm --filter @ovo/mcp build
```

This compiles TypeScript to `apps/mcp/dist/`. You'll need Node.js to run it.

### 3. Configure Your MCP Client

The server uses **stdio transport** — your MCP client spawns it as a subprocess and communicates over stdin/stdout.

#### Claude Desktop

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

**Using the prebuilt binary:**

```json
{
  "mcpServers": {
    "ovo": {
      "command": "/path/to/ovo-mcp-darwin-arm64-abc1234",
      "env": {
        "OVO_API_URL": "https://ovo-backend.vercel.app",
        "OVO_ACCESS_TOKEN": "ovo_k_your_api_key_here"
      }
    }
  }
}
```

**Using Node.js (built from source):**

```json
{
  "mcpServers": {
    "ovo": {
      "command": "node",
      "args": ["/absolute/path/to/Ovo/apps/mcp/dist/index.js"],
      "env": {
        "OVO_API_URL": "https://ovo-backend.vercel.app",
        "OVO_ACCESS_TOKEN": "ovo_k_your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json` in your project root, or the global config):

**Using the prebuilt binary:**

```json
{
  "mcpServers": {
    "ovo": {
      "command": "/path/to/ovo-mcp-linux-x64-abc1234",
      "env": {
        "OVO_API_URL": "https://ovo-backend.vercel.app",
        "OVO_ACCESS_TOKEN": "ovo_k_your_api_key_here"
      }
    }
  }
}
```

**Using Node.js (built from source):**

```json
{
  "mcpServers": {
    "ovo": {
      "command": "node",
      "args": ["/absolute/path/to/Ovo/apps/mcp/dist/index.js"],
      "env": {
        "OVO_API_URL": "https://ovo-backend.vercel.app",
        "OVO_ACCESS_TOKEN": "ovo_k_your_api_key_here"
      }
    }
  }
}
```

#### OpenCode

Add to your OpenCode MCP config (`opencode.json`):

```json
{
  "mcp": {
    "ovo": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/Ovo/apps/mcp/dist/index.js"],
      "env": {
        "OVO_API_URL": "https://ovo-backend.vercel.app",
        "OVO_ACCESS_TOKEN": "ovo_k_your_api_key_here"
      }
    }
  }
}
```

#### Development Mode

If you want hot-reload during development instead of running the compiled output:

```json
{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/Ovo/apps/mcp/src/index.ts"],
  "env": {
    "OVO_API_URL": "http://localhost:3001",
    "OVO_ACCESS_TOKEN": "ovo_k_your_api_key_here"
  }
}
```

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OVO_API_URL` | Yes | Base URL of the Ovo backend (no trailing slash, no `/api`) | `https://ovo-backend.vercel.app` |
| `OVO_ACCESS_TOKEN` | Yes | API key (starts with `ovo_k_`) | `ovo_k_a1b2c3d4e5f6...` |

## Tools

The MCP server exposes 6 tools that AI assistants can call:

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tasks` | List tasks with optional filters | `status?`, `priority?`, `search?`, `sortBy?`, `sortOrder?`, `page?`, `limit?` |
| `get_task` | Get a specific task by ID | `taskId` |
| `create_task` | Create a new task | `title`, `description?`, `status?`, `priority?`, `dueDate?` |
| `update_task` | Update an existing task (partial) | `taskId`, `title?`, `description?`, `status?`, `priority?`, `dueDate?` |
| `delete_task` | Permanently delete a task | `taskId` |
| `get_stats` | Get task completion statistics | *(none)* |

### Example Prompts

Once connected, you can ask your AI assistant things like:

- "Show me all my high-priority tasks"
- "Create a task to review the PR, due Friday, high priority"
- "Mark task cm5abc123 as completed"
- "What are my task stats?"
- "Delete the task about fixing the login bug"

## Resources

The server also exposes 4 MCP resources that clients can read directly:

| URI | Description | Format |
|-----|-------------|--------|
| `ovo://tasks` | All tasks (up to 100) | JSON |
| `ovo://tasks/{taskId}` | Single task detail | Plain text |
| `ovo://stats` | Task completion statistics | JSON |
| `ovo://profile` | Your user profile | JSON |

Resources are read-only views of your data. Clients that support resource browsing (like Claude Desktop) will show these in their resource panel.

## Troubleshooting

**"Fatal error" or server won't start**
- Make sure you ran `pnpm --filter @ovo/mcp build` first (or use `tsx` for dev mode)
- Check that `OVO_API_URL` and `OVO_ACCESS_TOKEN` are set in the MCP client config

**"Authentication required" errors on every tool call**
- Verify your API key is correct and hasn't been revoked
- Make sure the key starts with `ovo_k_` — if you're accidentally passing a JWT, it'll expire after 15 minutes

**"Network error" or connection refused**
- Check `OVO_API_URL` — it should be the backend base URL without `/api` (the server adds that)
- If using localhost, make sure the backend is running (`pnpm dev:backend`)

**Tools show up but return empty results**
- You might not have any tasks yet. Try creating one first: "Create a task called hello world"

**Server logs**
- The MCP server logs to stderr (so it doesn't interfere with the stdio protocol). Your MCP client should surface these somewhere in its logs or developer console.
