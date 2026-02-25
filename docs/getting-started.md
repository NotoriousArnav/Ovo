# Getting Started

This guide walks you through setting up the Ovo monorepo for local development.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | >= 20 | JavaScript runtime |
| [pnpm](https://pnpm.io/) | >= 9 | Package manager (monorepo workspaces) |
| [NeonDB](https://neon.tech/) | — | Serverless PostgreSQL (free tier available) |
| [Java JDK](https://openjdk.org/) | 17 | Required for Android APK builds only |

## 1. Clone and Install

```bash
git clone https://github.com/NotoriousArnav/Ovo.git
cd Ovo
pnpm install
```

pnpm will install dependencies for all workspaces (`apps/backend`, `apps/web`, `apps/mobile`, `apps/mcp`, `packages/shared`) and hoist them according to `.npmrc`:

```ini
node-linker=hoisted
auto-install-peers=true
```

## 2. Environment Variables

### Backend (`apps/backend/.env`)

```bash
cp apps/backend/.env.example apps/backend/.env
```

Fill in the following:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string | `postgresql://user:pass@host.neon.tech/ovo?sslmode=require` |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing JWT access tokens | 64-char hex string |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens | 64-char hex string |
| `PORT` | No | Server port (default: `3001`) | `3001` |
| `NODE_ENV` | No | Environment (default: `development`) | `development` |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: `*`) | `*` |
| `EH_CLIENT_ID` | No | Event Horizon OAuth client ID (for Community SSO) | `your-client-id` |
| `EH_CLIENT_SECRET` | No | Event Horizon OAuth client secret | `your-client-secret` |
| `EH_URL` | No | Event Horizon instance URL | `https://events.neopanda.tech` |
| `EH_ALLOWED_REDIRECTS` | No | Comma-separated allowlist of client OAuth redirect URIs | `http://localhost:5173/auth/eventhorizon/callback,ovo://auth/callback` |
| `BASE_URL` | No | Public base URL of the backend (used for OAuth callback) | `https://ovo-backend.vercel.app` |
| `AI_PROVIDER` | No | LLM provider for AI features (default: `groq`) | `groq` |
| `AI_MODEL` | No | LLM model name (default: `llama-3.3-70b-versatile`) | `llama-3.3-70b-versatile` |
| `GROQ_API_KEY` | No | Groq API key (required for AI daily summary) | `gsk_...` |
| `AI_RATE_LIMIT_ENABLED` | No | Enable per-user AI rate limiting (default: `true`) | `true` |
| `AI_RATE_LIMIT_MAX` | No | Max AI requests per window per user (default: `20`) | `20` |
| `AI_RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: `3600000` = 1 hour) | `3600000` |

The EH variables are only needed if you want "Sign in with Event Horizon" — see [Event Horizon OAuth](./event-horizon-oauth.md) for the full setup. The AI variables are only needed if you want AI daily summaries — see [Architecture](./architecture.md#ai-daily-summary) for details.

Generate JWT secrets:

```bash
openssl rand -hex 64
```

### Web (`apps/web/.env`)

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:3001/api` (dev) or `https://ovo-backend.vercel.app/api` (prod) |

### Mobile (`apps/mobile/.env`)

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API base URL | `http://localhost:3001` (dev) or `https://ovo-backend.vercel.app` (prod) |

## 3. Database Setup

Ovo uses [Prisma ORM](https://www.prisma.io/) with NeonDB. After configuring `DATABASE_URL`:

```bash
# Generate the Prisma client (TypeScript types from your schema)
pnpm --filter @ovo/backend db:generate

# Push the schema to your database (creates tables)
pnpm --filter @ovo/backend db:push
```

The Prisma schema is at `apps/backend/prisma/schema.prisma`. It defines five models:

- **User** — `id`, `name`, `email`, `passwordHash`, `authProvider`, `notificationHour`, `notificationMinute`, timestamps
- **Task** — `id`, `title`, `description`, `status`, `priority`, `dueDate`, `userId`, timestamps
- **RefreshToken** — `id`, `token`, `userId`, `expiresAt`, `createdAt`
- **ApiKey** — `id`, `name`, `keyHash`, `keyPrefix`, `lastUsedAt`, `userId`, timestamps
- **DailySummaryCache** — `id`, `userId`, `date`, `summary`, `createdAt` (unique on `userId + date`, auto-cleaned)

Other useful database commands:

```bash
# Open Prisma Studio (visual database browser)
pnpm --filter @ovo/backend db:studio

# Create a migration (for production workflows)
pnpm --filter @ovo/backend db:migrate
```

## 4. Running Development Servers

### Both at once (via Turborepo)

```bash
pnpm dev
```

This runs `turbo dev`, which starts the backend, web, and mobile dev servers in parallel.

### Individually

```bash
# Backend only — Express API on http://localhost:3001
pnpm dev:backend

# Web only — Vue 3 SPA on http://localhost:5173
pnpm dev:web

# Mobile only — Expo dev server
pnpm dev:app
```

### Verify the backend is running

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Ovo API is running",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 5. Available Scripts

### Root (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `turbo dev` | Run all dev servers |
| `pnpm dev:app` | `turbo dev --filter=@ovo/mobile` | Run mobile dev server only |
| `pnpm dev:web` | `turbo dev --filter=@ovo/web` | Run web dev server only |
| `pnpm dev:backend` | `turbo dev --filter=@ovo/backend` | Run backend dev server only |
| `pnpm build` | `turbo build` | Build all packages |
| `pnpm build:web` | `turbo build --filter=@ovo/web` | Build web app only (output: `apps/web/dist/`) |
| `pnpm typecheck` | `turbo typecheck` | Type-check all packages |
| `pnpm lint` | `turbo lint` | Lint all packages |
| `pnpm test` | `turbo test` | Run all tests |
| `pnpm clean` | `turbo clean && rm -rf node_modules` | Clean everything |

### Backend (`apps/backend/package.json`)

| Script | Description |
|--------|-------------|
| `dev` | Start dev server with hot reload (`tsx watch`) |
| `build` | Compile TypeScript (`tsc && tsc-alias`) |
| `start` | Run compiled JS (`node dist/index.js`) |
| `typecheck` | Type-check without emitting (`tsc --noEmit`) |
| `db:generate` | Generate Prisma client |
| `db:push` | Push schema to database |
| `db:migrate` | Create and run migrations |
| `db:studio` | Open Prisma Studio GUI |

### Mobile (`apps/mobile/package.json`)

| Script | Description |
|--------|-------------|
| `dev` | Start Expo with dev client |
| `start` | Start Expo dev server |
| `android` | Run on Android device/emulator |
| `ios` | Run on iOS simulator |
| `web` | Start web version |
| `typecheck` | Type-check without emitting |
| `prebuild` | Generate native projects (`expo prebuild --clean`) |

## Next Steps

- Read the [Architecture](./architecture.md) guide to understand how the pieces fit together.
- See the [API Reference](./api-reference.md) for endpoint details and curl examples.
- Check [Deployment](./deployment.md) when you're ready to ship.
