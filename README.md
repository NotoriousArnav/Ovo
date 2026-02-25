# Ovo

**A simple, self-hosted task management application.**

Ovo is a full-stack task manager you deploy on your own infrastructure. It ships with a **Vue 3 web app**, a **native Android client** (Expo React Native), and an **Express.js REST API** — all sharing types and validation through a common package. Your data stays on your server, under your control. Built for the [BroCode Tech](https://brocode-tech.netlify.app/) community.

## Highlights

- **Self-hosted** — Deploy the backend anywhere that runs Node.js. Use your own PostgreSQL database.
- **Cross-platform** — Vue 3 SPA for desktop/web, Android APK for mobile, both talking to the same API.
- **Material Design 3** — Clean MD3 theming with automatic dark mode. On Android 12+, colors adapt to the device wallpaper.
- **Open source** — GPL-3.0. Inspect, fork, and self-host freely.

## Community

Ovo is built for and by the [BroCode Tech](https://brocode-tech.netlify.app/) community — an open tech community for developers, builders, and learners.

- **Community Website**: [brocode-tech.netlify.app](https://brocode-tech.netlify.app/)
- **Events**: [events.neopanda.tech](https://events.neopanda.tech) — community events and meetups
- **GitHub**: [github.com/NotoriousArnav/Ovo](https://github.com/NotoriousArnav/Ovo)

## Tech Stack

| Layer | Technology |
|---|---|
| Web | Vue 3, Pinia, TypeScript, Vite |
| Mobile | Expo SDK 54, React Native, react-native-paper v5, Zustand |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (NeonDB) via Prisma ORM |
| Auth | JWT access + refresh tokens, bcrypt, token rotation |
| Validation | Zod (shared between all clients and backend) |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions — lint, typecheck, APK builds with per-arch releases |

## Architecture

```
Ovo/
├── apps/
│   ├── backend/         # Express.js REST API (Prisma, JWT, Swagger)
│   ├── web/             # Vue 3 SPA (Pinia, MD3, Vite)
│   └── mobile/          # Expo React Native app (Paper v5, Zustand)
├── packages/
│   └── shared/          # Shared TypeScript types & Zod schemas
├── docs/                # Project documentation
├── .github/workflows/   # CI + APK build pipelines
├── turbo.json           # Turborepo task config
└── pnpm-workspace.yaml  # Workspace definition
```

Types and validation schemas are defined once in `packages/shared` and consumed by all apps — no type drift, consistent validation everywhere.

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL database (e.g. [NeonDB](https://neon.tech) free tier, or any self-hosted Postgres)

### 1. Clone and install

```bash
git clone https://github.com/NotoriousArnav/Ovo.git
cd Ovo
pnpm install
```

### 2. Configure environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Set DATABASE_URL, JWT_ACCESS_SECRET, CORS_ORIGIN

# Web
cp apps/web/.env.example apps/web/.env
# Set VITE_API_URL (e.g. http://localhost:3001/api)

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
# Set EXPO_PUBLIC_API_URL
```

Generate a JWT secret:

```bash
openssl rand -hex 64
```

### 3. Set up database

```bash
pnpm --filter @ovo/backend db:generate   # Generate Prisma client
pnpm --filter @ovo/backend db:push       # Push schema to database
```

### 4. Run

```bash
# All apps in parallel
pnpm dev

# Or individually
pnpm dev:backend   # Express API — http://localhost:3001
pnpm dev:web       # Vue 3 SPA — http://localhost:5173
pnpm dev:app       # Expo dev server
```

## Deployment

### Backend (Vercel or any Node.js host)

```bash
cd apps/backend
npx vercel
```

Set these environment variables on your host:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing JWTs |
| `CORS_ORIGIN` | Allowed origin(s) for CORS |

### Web (Netlify or any static host)

The web app is a static SPA. Build and deploy to any static hosting:

```bash
pnpm --filter @ovo/web build
# Output: apps/web/dist/
```

A `netlify.toml` is included for one-click Netlify deploys.

### Mobile (Android APK)

APKs are automatically built per-architecture (`arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`, `universal`) by GitHub Actions on every push to `main` and published as GitHub Releases.

To install via [Obtainium](https://github.com/ImranR98/Obtainium) for automatic updates, see the [Obtainium guide](docs/obtainium.md).

To build locally:

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

## Documentation

| Document | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Prerequisites, installation, environment setup |
| [Architecture](docs/architecture.md) | Directory structure, tech decisions, auth flow |
| [API Reference](docs/api-reference.md) | All REST endpoints with schemas and curl examples |
| [Mobile App](docs/mobile-app.md) | Screens, navigation, theming, stores, APK building |
| [Deployment](docs/deployment.md) | Vercel, Netlify, GitHub Actions, APK signing |
| [Shared Package](docs/shared-package.md) | Workspace linking, types, Vercel workaround |
| [Obtainium](docs/obtainium.md) | Install and auto-update the Android app via Obtainium |

### Live API

- **Swagger UI**: [ovo-backend.vercel.app/api/docs](https://ovo-backend.vercel.app/api/docs)
- **OpenAPI JSON**: [ovo-backend.vercel.app/api/docs.json](https://ovo-backend.vercel.app/api/docs.json)

## Roadmap

Planned features for upcoming releases:

### MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes Ovo tasks to AI assistants and LLM-powered tools. This will allow AI agents to read, create, update, and manage tasks through a standardized protocol — enabling integration with any MCP-compatible client.

### Universal Calendar Integration

Sync tasks with external calendars — Google Calendar, Apple Calendar, CalDAV, and other providers. Due dates and task schedules will appear in your existing calendar workflow, with two-way sync support.

### LangChain Integration

Backend-side [LangChain](https://www.langchain.com/) integration for AI-assisted task management. This will power features like:

- Natural language task creation ("remind me to review the PR tomorrow at 2pm")
- Intelligent task prioritization suggestions
- Task summarization and progress reports
- Conversational queries over your task data

LangChain is integrated in the backend rather than the client, so all AI capabilities are available to every client (web, mobile, MCP) without duplicating logic.

## API Overview

Base URL: `/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, returns JWT pair |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | No | Invalidate refresh token |
| GET | `/tasks` | Yes | List tasks (filter, paginate, sort) |
| GET | `/tasks/stats` | Yes | Task completion statistics |
| GET | `/tasks/:id` | Yes | Get single task |
| POST | `/tasks` | Yes | Create task |
| PUT | `/tasks/:id` | Yes | Update task |
| DELETE | `/tasks/:id` | Yes | Delete task |
| GET | `/user/profile` | Yes | Get user profile |

## License

[GNU General Public License v3.0](./LICENSE)
