# Shared Package

The `@ovo/shared` package contains TypeScript types and Zod validation schemas that are shared between the backend and mobile app.

## What It Contains

```
packages/shared/
├── src/
│   ├── index.ts         # Re-exports everything
│   ├── types.ts         # TypeScript interfaces
│   └── validation.ts    # Zod schemas + inferred types
├── package.json
└── tsconfig.json
```

### Types (`types.ts`)

Core type definitions used across all apps. Here are a few key examples:

```typescript
// Task — the central data model
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;      // "pending" | "in_progress" | "completed"
  priority: TaskPriority;  // "low" | "medium" | "high"
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// AI Daily Summary — returned by the LLM
export interface DailySummary {
  summary: string;
  focusTasks: DailySummaryFocusTask[];  // { id, title, reason }
  encouragement: string;
  generatedAt: string;
}

// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

Full type list:

| Type | Description |
|------|-------------|
| `User` | User object (`id`, `name`, `email`, `authProvider`, `createdAt`, `updatedAt`) |
| `AuthProvider` | `"local" \| "eventhorizon"` — how the user signed up |
| `Task` | Task object with all fields |
| `TaskStatus` | `"pending" \| "in_progress" \| "completed"` |
| `TaskPriority` | `"low" \| "medium" \| "high"` |
| `ApiResponse<T>` | Standard success response wrapper |
| `ApiError` | Error response with optional field-level errors |
| `PaginatedResponse<T>` | Paginated list response with `data[]` and `pagination` |
| `AuthTokens` | `{ accessToken, refreshToken }` |
| `LoginResponse` | `{ user, tokens }` |
| `RegisterResponse` | `{ user, tokens }` |
| `TaskFilters` | Query parameters for task listing |
| `TaskStats` | Task statistics (`total`, `pending`, `inProgress`, `completed`, `completionRate`) |
| `NotificationSettings` | `{ hour, minute }` — user's daily notification time |
| `DailySummaryFocusTask` | `{ id, title, reason }` — a single focus task from the AI summary |
| `DailySummary` | `{ summary, focusTasks, encouragement, generatedAt }` — full AI daily summary |

### Validation Schemas (`validation.ts`)

Zod schemas that validate input on both client and server. Each schema also exports an inferred TypeScript type. Here are two key examples:

```typescript
// Task creation — validates input, sets defaults
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().default(""),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime().nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// AI daily summary — used as LLM structured output schema
export const dailySummaryResponseSchema = z.object({
  summary: z.string().describe("A short, ADHD-friendly overview of what to focus on today"),
  focusTasks: z.array(dailySummaryFocusTaskSchema).min(1).max(5)
    .describe("Top 3-5 tasks to focus on, ordered by urgency"),
  encouragement: z.string().describe("A brief, genuine encouragement — one sentence, no fluff"),
});
```

Full schema list:

| Schema | Used By | Purpose |
|--------|---------|---------|
| `registerSchema` | Backend (validation middleware), Mobile (client-side validation) | Validates registration input |
| `loginSchema` | Backend, Mobile | Validates login input |
| `refreshTokenSchema` | Backend | Validates refresh token request |
| `createTaskSchema` | Backend, Mobile | Validates task creation input |
| `updateTaskSchema` | Backend, Mobile | Validates task update input |
| `taskFiltersSchema` | Backend | Validates and coerces query parameters for task listing |
| `ehLoginRedirectSchema` | Backend | Validates the `redirect_uri` query param for Event Horizon OAuth login |
| `dailySummaryFocusTaskSchema` | Backend (AI service) | Schema for a single focus task in the AI summary |
| `dailySummaryResponseSchema` | Backend (AI service, LLM structured output) | Schema for the full AI daily summary response |
| `notificationSettingsSchema` | Backend (user controller) | Validates notification time update requests (`hour`, `minute`) |

Each schema also exports an inferred TypeScript type (e.g., `RegisterInput`, `CreateTaskInput`, `EHLoginRedirectInput`, `NotificationSettingsInput`).

### Package Configuration

```json
{
  "name": "@ovo/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./validation": "./src/validation.ts"
  },
  "dependencies": {
    "zod": "^3.24.0"
  }
}
```

The package uses **TypeScript source directly** (`main` and `types` point to `.ts` files) rather than a compiled `dist/` directory. This works because both consumers (Expo and the backend dev server via `tsx`) can process TypeScript directly.

## How Workspace Linking Works

The monorepo is defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

The mobile app depends on `@ovo/shared` in its `package.json`:

```json
{
  "dependencies": {
    "@ovo/shared": "workspace:*"
  }
}
```

The web app uses the same workspace link — `@ovo/shared` is listed as a dependency in `apps/web/package.json` too.

When `pnpm install` runs, it creates a symlink from `apps/mobile/node_modules/@ovo/shared` to `packages/shared/`. This means:

- Changes to `packages/shared/src/` are **immediately** reflected in the mobile app (no rebuild needed).
- TypeScript path resolution follows the symlink to the actual source files.
- Metro (React Native bundler) resolves the import and bundles the shared code into the app.

## The Vercel Problem

When the backend was deployed to Vercel, it originally used the same `"@ovo/shared": "workspace:*"` dependency. This broke because:

1. Vercel's serverless bundler runs in an isolated environment.
2. The `includeFiles` directive in `vercel.json` bundles files for the serverless function, but **pnpm workspace symlinks are not followed** during bundling.
3. The serverless function would try to `require("@ovo/shared")`, find nothing at the expected path, and crash with `MODULE_NOT_FOUND`.

### Attempted Fixes That Didn't Work

- **Adding `packages/shared/**` to `includeFiles`**: Vercel doesn't resolve workspace symlinks even with explicit file inclusion.
- **Using `nohoist`**: pnpm's `.npmrc` with `node-linker=hoisted` doesn't help because Vercel's bundler has its own resolution.

### The Fix: Inlined Copy

The shared code was **copied** into `apps/backend/src/shared/`:

```
apps/backend/src/shared/
├── index.ts         # Same as packages/shared/src/index.ts
├── types.ts         # Same as packages/shared/src/types.ts
└── validation.ts    # Same as packages/shared/src/validation.ts
```

The backend imports from `./shared` (relative path) instead of `@ovo/shared`:

```typescript
// apps/backend/src/routes/auth.ts
import { registerSchema, loginSchema, refreshTokenSchema } from "../shared";
```

The `@ovo/shared` dependency was **removed** from `apps/backend/package.json`.

## Current State

| Consumer | How it imports shared code |
|----------|--------------------------|
| **Web app** (`apps/web/`) | `import { ... } from "@ovo/shared"` — via pnpm workspace symlink |
| **Mobile app** (`apps/mobile/`) | `import { ... } from "@ovo/shared"` — via pnpm workspace symlink |
| **Backend** (`apps/backend/`) | `import { ... } from "../shared"` — via inlined copy at `src/shared/` |

### Tradeoff

The inlined copy means there are **two copies** of the shared code:

1. `packages/shared/src/` — the source of truth
2. `apps/backend/src/shared/` — the copy for Vercel compatibility

If you update a type or schema in `packages/shared/`, you must also update the copy in `apps/backend/src/shared/`. This is a manual process.

**Future improvements:**
- A pre-deploy script could automate syncing `packages/shared/src/` to `apps/backend/src/shared/`.
- Switching to a bundler-based build step for the backend (e.g., `tsup` or `esbuild`) could resolve the workspace import at build time, eliminating the need for inlining.

### Keeping the Copies in Sync

Currently, syncing is a **manual process**:

1. Make your changes in `packages/shared/src/` (the source of truth)
2. Copy the changed files to `apps/backend/src/shared/`
3. Run `pnpm typecheck` to verify both copies are consistent

A quick way to sync:

```bash
cp packages/shared/src/*.ts apps/backend/src/shared/
pnpm typecheck
```

**Potential future automation:**

- Add a `pnpm sync:shared` script to the root `package.json` that copies the files and runs typecheck
- Add a CI check that diffs the two directories and fails if they're out of sync:
  ```bash
  diff -r packages/shared/src/ apps/backend/src/shared/ || (echo "Shared package out of sync!" && exit 1)
  ```
