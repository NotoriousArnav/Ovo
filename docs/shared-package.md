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

| Type | Description |
|------|-------------|
| `User` | User object (`id`, `name`, `email`, `createdAt`, `updatedAt`) |
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

### Validation Schemas (`validation.ts`)

| Schema | Used By | Purpose |
|--------|---------|---------|
| `registerSchema` | Backend (validation middleware), Mobile (client-side validation) | Validates registration input |
| `loginSchema` | Backend, Mobile | Validates login input |
| `refreshTokenSchema` | Backend | Validates refresh token request |
| `createTaskSchema` | Backend, Mobile | Validates task creation input |
| `updateTaskSchema` | Backend, Mobile | Validates task update input |
| `taskFiltersSchema` | Backend | Validates and coerces query parameters for task listing |

Each schema also exports an inferred TypeScript type (e.g., `RegisterInput`, `CreateTaskInput`).

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
