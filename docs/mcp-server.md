# MCP Server

The Ovo MCP server exposes your tasks to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/). Hook it up to Claude Desktop, Cursor, OpenCode, or any MCP-compatible client, and you can manage your Ovo tasks through natural language without leaving your editor.

It talks to the Ovo backend over HTTP using an API key for authentication — no direct database access.

### What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard for connecting AI assistants to external tools and data sources. Instead of building custom plugins for each AI client, you build one MCP server and it works with any client that supports the protocol.

The Ovo MCP server uses **stdio transport** — the AI client spawns the server as a subprocess and communicates via JSON-RPC messages over stdin/stdout. This is different from the REST API (which uses HTTP requests). You don't call the MCP server directly; your AI assistant does it for you behind the scenes.

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

MCP **tools** are actions the AI assistant can invoke on your behalf — creating, updating, deleting tasks, etc. When you say "create a task called hello world", the assistant calls the `create_task` tool, which sends an HTTP request to the Ovo backend.

The MCP server exposes 9 tools that AI assistants can call:

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tasks` | List tasks with optional filters | `status?`, `priority?`, `search?`, `sortBy?`, `sortOrder?`, `page?`, `limit?` |
| `get_task` | Get a specific task by ID | `taskId` |
| `create_task` | Create a new task | `title`, `description?`, `status?`, `priority?`, `dueDate?` |
| `update_task` | Update an existing task (partial) | `taskId`, `title?`, `description?`, `status?`, `priority?`, `dueDate?` |
| `delete_task` | Permanently delete a task | `taskId` |
| `get_stats` | Get task completion statistics | *(none)* |
| `get_daily_summary` | Get AI-generated daily focus tasks with reasons and encouragement | *(none)* |
| `get_notification_time` | Get current notification time setting | *(none)* |
| `set_notification_time` | Set daily notification time | `hour`, `minute` |

### Example Prompts

Once connected, you can ask your AI assistant things like:

- "Show me all my high-priority tasks"
- "Create a task to review the PR, due Friday, high priority"
- "Mark task cm5abc123 as completed"
- "What are my task stats?"
- "Delete the task about fixing the login bug"
- "What should I focus on today?" (triggers AI daily summary)
- "What time are my daily notifications set for?"
- "Set my notification time to 8:30 AM"

## Resources

MCP **resources** are read-only data the AI assistant can browse without explicitly calling a tool. Think of tools as "verbs" (do something) and resources as "nouns" (look at something). Not all MCP clients support resource browsing — Claude Desktop does, but some others may not.

The server exposes 5 MCP resources:

| URI | Description | Format |
|-----|-------------|--------|
| `ovo://tasks` | All tasks (up to 100) | JSON |
| `ovo://tasks/{taskId}` | Single task detail | Plain text |
| `ovo://stats` | Task completion statistics | JSON |
| `ovo://profile` | Your user profile | JSON |
| `ovo://daily-summary` | AI-generated daily focus summary | JSON |

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

## Build Pipeline

The MCP server can be built as a **standalone binary** using Node.js [Single Executable Applications (SEA)](https://nodejs.org/api/single-executable-applications.html). This means end users don't need Node.js installed.

### How the build works

```
TypeScript source (src/)
    │
    ▼  esbuild (pnpm build:bundle)
Single JS bundle (dist/ovo-mcp-bundle.cjs)
    │
    ▼  node --experimental-sea-config sea-config.json
SEA blob (dist/ovo-mcp.blob)
    │
    ▼  postject (inject blob into Node binary)
Standalone binary (dist/ovo-mcp)
    │
    ▼  codesign (macOS only — ad-hoc re-sign)
Final binary
```

### CI/CD

GitHub Actions (`.github/workflows/build-mcp.yml`) runs this pipeline on every push to `main`, building **6 platform targets** in parallel:

- `linux-x64`, `linux-arm64` — native builds
- `darwin-arm64` (Apple Silicon), `darwin-x64` (Intel) — native builds with ad-hoc codesigning
- `win-x64` — native build
- `win-arm64` — cross-compiled on Linux by downloading a Node.js Windows ARM64 binary

All 6 binaries are attached to the GitHub Release (tagged by commit short SHA). The release step uses `append_body: true` so it doesn't overwrite the APK workflow's release notes.

### Building locally

```bash
# Bundle only (produces dist/index.js — requires Node to run)
pnpm --filter @ovo/mcp build

# Full SEA build (produces standalone binary)
pnpm --filter @ovo/mcp build:bundle
cd apps/mcp
node --experimental-sea-config sea-config.json
cp $(command -v node) dist/ovo-mcp
npx postject dist/ovo-mcp NODE_SEA_BLOB dist/ovo-mcp.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
chmod +x dist/ovo-mcp
```
