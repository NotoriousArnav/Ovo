# Architecture

This document describes the overall architecture of Ovo, including the monorepo structure, technology choices, request lifecycle, authentication flow, and client-side state management.

## Monorepo Layout

Ovo is a **pnpm workspace monorepo** managed by **Turborepo**:

```
Ovo/
├── apps/
│   ├── backend/                 # Express.js REST API
│   │   ├── api/
│   │   │   └── index.ts         # Vercel serverless entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── src/
│   │       ├── controllers/     # Route handlers
│   │       │   ├── ai.ts
│   │       │   ├── auth.ts
│   │       │   ├── tasks.ts
│   │       │   └── user.ts
│   │       ├── services/        # Business logic
│   │       │   ├── ai.ts
│   │       │   ├── auth.ts
│   │       │   └── tasks.ts
│   │       ├── middleware/       # Express middleware
│   │       │   ├── auth.ts      # JWT authentication
│   │       │   ├── errorHandler.ts
│   │       │   ├── rateLimit.ts # Per-user AI rate limiting
│   │       │   └── validate.ts  # Zod validation
│   │       ├── routes/          # Route definitions
│   │       │   ├── ai.ts
│   │       │   ├── auth.ts
│   │       │   ├── tasks.ts
│   │       │   └── user.ts
│   │       ├── shared/          # Inlined copy of @ovo/shared
│   │       │   ├── index.ts
│   │       │   ├── types.ts
│   │       │   └── validation.ts
│   │       ├── lib/
│   │       │   ├── llm.ts       # LLM model factory (Groq/LangChain)
│   │       │   └── prisma.ts    # Prisma client singleton
│   │       ├── app.ts           # Express app setup
│   │       └── index.ts         # Local dev entry (dotenv + listen)
│   │
│   ├── web/                     # Vue 3 SPA
│   │   ├── src/
│   │   │   ├── pages/           # Route-level page components
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── stores/          # Pinia state stores
│   │   │   ├── services/        # API service layer (fetch)
│   │   │   ├── layouts/         # Layout wrappers
│   │   │   ├── router/          # Vue Router config
│   │   │   ├── App.vue          # Root component
│   │   │   └── main.ts          # App entry point
│   │   ├── public/              # Static assets
│   │   └── index.html           # SPA shell
│   │
│   └── mobile/                  # Expo SDK 54 React Native app
│       ├── app/                 # expo-router file-based routing
│       │   ├── _layout.tsx      # Root layout (providers, theme)
│       │   ├── index.tsx        # Entry redirect
│       │   ├── (auth)/          # Unauthenticated routes
│       │   │   ├── _layout.tsx  # Auth guard (redirect if authed)
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   └── (app)/           # Authenticated routes
│       │       ├── _layout.tsx  # App guard (redirect if not authed)
│       │       ├── home.tsx     # Dashboard + task list
│       │       ├── task.tsx     # Create/edit task form
│       │       └── profile.tsx
│       ├── components/          # Reusable UI components
│       ├── stores/              # Zustand state stores
│       ├── services/            # API service layer (Axios)
│       ├── theme/               # Material You theme config
│       └── constants/           # App configuration
│
├── packages/
│   └── shared/                  # Shared types & Zod schemas
│       └── src/
│           ├── index.ts
│           ├── types.ts         # TypeScript interfaces
│           └── validation.ts    # Zod schemas + inferred types
│
├── .github/workflows/           # CI + APK build pipelines
├── turbo.json                   # Turborepo task config
├── pnpm-workspace.yaml          # Workspace definition
└── package.json                 # Root scripts + packageManager
```

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Mobile UI** | Expo SDK 54, React Native | Cross-platform with native performance; Expo simplifies build tooling |
| **Web UI** | Vue 3, Pinia, TypeScript, Vite | Lightweight SPA framework; Pinia for state; Vite for fast dev/build |
| **UI Library** | react-native-paper v5 (MD3) | Material Design 3 components with built-in theming support |
| **Dynamic Theming** | `@pchmn/expo-material3-theme` | Extracts device wallpaper colors on Android 12+ for Material You |
| **Navigation** | expo-router v6 | File-based routing with type safety; route groups for auth separation |
| **Client State** | Zustand v5 | Minimal boilerplate, surgical re-renders, built-in async action support |
| **HTTP Client** | Axios | Interceptors for automatic token attachment and refresh |
| **Secure Storage** | expo-secure-store | Encrypted storage for JWT tokens on device |
| **Backend** | Express.js 4 | Mature, minimal, well-understood HTTP framework |
| **Database** | PostgreSQL (NeonDB) | Serverless Postgres; scales to zero; free tier for development |
| **ORM** | Prisma v6 | Type-safe queries, auto-generated client, declarative schema migrations |
| **Auth** | JWT + bcrypt | Stateless access tokens (15min) + rotating refresh tokens (7 days) |
| **Validation** | Zod | Runtime validation with TypeScript type inference; shared between client and server |
| **AI / LLM** | LangChain + Groq (`llama-3.3-70b-versatile`) | Provider-agnostic LLM abstraction; Groq chosen for generous free tier |
| **AI Rate Limiting** | `express-rate-limit` | Per-user rate limiting on AI endpoints (20 req/user/hour, configurable) |
| **Push Notifications** | `expo-notifications` | Local scheduled notifications for daily AI summary (no Firebase/APNs) |
| **Monorepo** | pnpm workspaces + Turborepo | Fast installs via content-addressable store; task caching and parallel execution |
| **Deployment** | Vercel (backend), Netlify (web), GitHub Actions (APK) | Zero-config serverless for Express; static hosting for Vue SPA; automated APK builds with release artifacts |

## Request Lifecycle (Backend)

Every API request flows through this pipeline:

```
Client Request
    │
    ▼
┌─────────────────────────┐
│  Express.js              │
│  ├── helmet()            │  Security headers (CSP, HSTS, etc.)
│  ├── cors()              │  CORS with configurable origin
│  ├── morgan("dev")       │  HTTP request logging
│  └── express.json(10kb)  │  Body parser with size limit
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Router                  │  Route matching (/api/auth, /api/tasks, /api/user, /api/ai)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  authenticate()          │  (Protected routes only)
│  Extract Bearer token    │  Verify JWT, attach userId to request
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  validate(schema, src)   │  Zod validation on body or query
│  Parse & transform data  │  Attach validated data to req.body or req.validatedQuery
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Controller              │  Delegates to service layer
│  Format response         │  Returns { success, data, message }
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Service                 │  Business logic
│  Prisma queries          │  Database operations via Prisma client
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  NeonDB (PostgreSQL)     │  Serverless PostgreSQL
└─────────────────────────┘
```

### Error Handling

Errors are caught by a global error handler (`errorHandler` middleware):

- **`AppError`** (operational errors) — returns the error's `statusCode` and `message`
- **`ZodError`** (validation failures) — returns `400` with field-level error messages
- **Unhandled errors** — returns `500` with a generic "Internal server error" message
- **404 catch-all** — any unmatched route returns `{ success: false, message: "Route not found" }`

## Authentication Flow

Ovo uses JWT access tokens with refresh token rotation:

```
┌──────────────────────────────────────────────────────────────────┐
│                        REGISTRATION / LOGIN                       │
│                                                                   │
│  1. Client sends credentials (email + password)                   │
│  2. Server validates, hashes password (bcrypt, 12 rounds)         │
│  3. Server creates user record (register) or verifies hash (login)│
│  4. Server generates:                                             │
│     - Access token (JWT, 15min expiry, contains userId)           │
│     - Refresh token (128-char random hex, stored in DB, 7 days)   │
│  5. Server returns { user, tokens: { accessToken, refreshToken }} │
│  6. Client stores both tokens in expo-secure-store                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATED REQUESTS                      │
│                                                                   │
│  1. Client attaches: Authorization: Bearer <accessToken>          │
│  2. authenticate() middleware verifies JWT signature + expiry      │
│  3. Extracts userId, attaches to request                          │
│  4. If token expired → returns 401                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       TOKEN REFRESH (ROTATION)                    │
│                                                                   │
│  1. Client receives 401 (access token expired)                    │
│  2. Client sends POST /api/auth/refresh { refreshToken }          │
│  3. Server looks up refresh token in DB                           │
│  4. If valid and not expired:                                     │
│     a. DELETE the old refresh token (one-time use)                │
│     b. Generate new access token + new refresh token              │
│     c. Store new refresh token in DB                              │
│     d. Return { accessToken, refreshToken }                       │
│  5. If invalid/expired → 401 (client must re-login)              │
│                                                                   │
│  The mobile app handles this automatically via Axios interceptors │
│  with a request queue to avoid race conditions.                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                            LOGOUT                                 │
│                                                                   │
│  1. Client sends POST /api/auth/logout { refreshToken }           │
│  2. Server deletes the refresh token from DB                      │
│  3. Client clears both tokens from secure storage                 │
└──────────────────────────────────────────────────────────────────┘
```

### Security Properties

- **Access tokens are stateless** — no database lookup required for verification
- **Refresh tokens are rotated** — each refresh token can only be used once
- **Passwords use bcrypt** — 12 salt rounds, resistant to brute force
- **Tokens stored securely** — `expo-secure-store` uses the platform keychain (iOS) or encrypted shared preferences (Android)
- **Helmet middleware** — sets security headers (Content-Security-Policy, X-Frame-Options, etc.)
- **Request body limit** — 10KB max to prevent abuse
- **CORS configurable** — defaults to `*` but can be restricted via `CORS_ORIGIN` env var

## State Management (Mobile)

The mobile app uses two Zustand stores:

### AuthStore (`stores/authStore.ts`)

Manages authentication state and user session.

```
State:
  user: User | null          # Current user object
  isAuthenticated: boolean   # Whether user is logged in
  isLoading: boolean         # Auth operation in progress
  isInitialized: boolean     # App has checked for existing session
  error: string | null       # Last auth error message

Actions:
  initialize()    # Check secure storage for existing token, validate via /user/profile
  login(input)    # POST /auth/login, store tokens, set user
  register(input) # POST /auth/register, store tokens, set user
  logout()        # POST /auth/logout, clear tokens, reset state
  clearError()    # Clear error message
```

### TaskStore (`stores/taskStore.ts`)

Manages tasks, filtering, pagination, and statistics.

```
State:
  tasks: Task[]                    # Current page of tasks
  stats: TaskStats | null          # Completion statistics
  isLoading: boolean               # Fetching tasks
  isRefreshing: boolean            # Pull-to-refresh in progress
  error: string | null             # Last error message
  statusFilter: TaskStatus?        # Active status filter
  priorityFilter: TaskPriority?    # Active priority filter
  searchQuery: string              # Search text
  sortBy: string                   # Sort field (createdAt, dueDate, priority, title)
  sortOrder: "asc" | "desc"        # Sort direction
  page: number                     # Current page
  totalPages: number               # Total pages available
  total: number                    # Total task count

Actions:
  fetchTasks(reset?)        # Fetch tasks with current filters (reset=true reloads from page 1)
  fetchStats()              # Fetch task statistics
  createTask(input)         # POST new task, prepend to list, refresh stats
  updateTask(id, input)     # PUT update task, replace in list, refresh stats
  deleteTask(id)            # DELETE task, remove from list, refresh stats
  setStatusFilter(status)   # Set filter and re-fetch
  setPriorityFilter(pri)    # Set filter and re-fetch
  setSearchQuery(query)     # Set search and re-fetch
  setSortBy(field)          # Set sort field and re-fetch
  setSortOrder(order)       # Set sort direction and re-fetch
  loadMore()                # Fetch next page (infinite scroll)
  refresh()                 # Pull-to-refresh (reset + fetch stats)
  clearError()              # Clear error
  reset()                   # Reset all state (used on logout)
```

### Why Zustand over React Context

1. **Surgical re-renders** — components only re-render when their specific subscribed slice changes, not the entire store
2. **No provider nesting** — stores are imported directly, no `<Provider>` wrapper needed
3. **Built-in async** — actions can be async without additional middleware
4. **Minimal boilerplate** — a single `create()` call defines state and actions together
5. **DevTools support** — compatible with Redux DevTools for debugging

## State Management (Web)

The Vue 3 web app uses two [Pinia](https://pinia.vuejs.org/) stores, mirroring the mobile app's structure:

### Auth Store (`stores/auth.ts`)

Manages authentication state, JWT tokens (stored in `localStorage`), and user session.

- `login()` / `register()` — call the backend, store tokens, set user
- `logout()` — invalidate refresh token, clear storage, reset state
- `eventHorizonLogin()` — redirects to the backend's EH OAuth endpoint; the callback page reads tokens from URL params
- `initialize()` — checks localStorage for an existing access token and validates via `/user/profile`

### Tasks Store (`stores/tasks.ts`)

Manages tasks, filtering, pagination, and statistics — same shape as the mobile TaskStore.

## Event Horizon OAuth

Ovo supports "Sign in with Event Horizon" — an OAuth2 Authorization Code flow with PKCE that uses BroCode's own [Event Horizon](https://events.neopanda.tech) instance as the identity provider. The backend owns the entire flow; clients just redirect to a single endpoint.

Users who sign in via Event Horizon have their `authProvider` field set to `"eventhorizon"` and have no password (the `passwordHash` column is nullable).

For the full flow diagram, architecture decisions, env vars, and client implementations, see [Event Horizon OAuth](./event-horizon-oauth.md).

## AI Daily Summary

Ovo includes an LLM-powered daily summary feature that tells users their top 3 focus tasks with reasons and encouragement.

### How It Works

```
User opens app / AI assistant calls tool
    │
    ▼
┌─────────────────────────────────────────────┐
│  GET /api/ai/daily-summary                   │
│  authenticate() + aiRateLimit()              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  AI Service: getDailySummary(userId)         │
│  1. Check DailySummaryCache for today        │
│     (userId + YYYY-MM-DD unique key)         │
│  2. If cached → return parsed JSON           │
│  3. If not cached:                           │
│     a. Fetch incomplete tasks from DB        │
│     b. Format as prompt for LLM              │
│     c. Call chain.invoke() with structured   │
│        output (Zod schema)                   │
│     d. Cache result in DailySummaryCache     │
│     e. Best-effort cleanup of old entries    │
│     f. Return DailySummary                   │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

1. **One LLM call per user per day** — Results are cached in the `DailySummaryCache` table (not in-memory, because Vercel serverless is stateless). The cache key is `userId + date (YYYY-MM-DD)`.

2. **Graceful degradation** — If `GROQ_API_KEY` is not set, the endpoint returns 503 and all frontends silently hide the summary card.

3. **Provider abstraction** — `lib/llm.ts` uses LangChain's `BaseChatModel` interface. Currently wired to Groq, but swapping to OpenAI/Anthropic requires only changing the import and env var.

4. **Rate limiting** — Per-user, 20 requests/hour (configurable via `AI_RATE_LIMIT_MAX`, `AI_RATE_LIMIT_WINDOW_MS`). Keyed by `userId`, not IP address.

5. **Notification time stored server-side** — `notificationHour` and `notificationMinute` columns on the `User` model, so the MCP server and all clients can read/write it. Mobile also caches locally in SecureStore for offline access.

6. **Local notifications** — Mobile uses `expo-notifications` scheduled daily notifications (not Firebase/APNs push). On app open, it fetches the summary and schedules a notification for the next morning at the user's configured time.

### LLM Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `AI_PROVIDER` | `groq` | LLM provider (`groq`, extensible) |
| `AI_MODEL` | `llama-3.3-70b-versatile` | Model name |
| `GROQ_API_KEY` | — | API key for the LLM provider |
| `AI_RATE_LIMIT_ENABLED` | `true` | Enable/disable rate limiting |
| `AI_RATE_LIMIT_MAX` | `20` | Max requests per window per user |
| `AI_RATE_LIMIT_WINDOW_MS` | `3600000` | Rate limit window (1 hour) |
