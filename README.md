# Ovo — Smart Task Manager

A production-ready full-stack mobile task manager built with **Expo React Native** and **Express.js**, featuring **Material You** dynamic theming.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 54, React Native, TypeScript, expo-router |
| UI | react-native-paper v5 (MD3), @pchmn/expo-material3-theme |
| State | Zustand |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (NeonDB) via Prisma ORM |
| Auth | JWT (access + refresh tokens), bcrypt |
| Validation | Zod (shared between frontend & backend) |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions (lint + APK build) |
| License | GPL-3.0 |

## Architecture

```
Ovo/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── backend/         # Express.js API server
├── packages/
│   └── shared/          # Shared types & Zod validation schemas
├── .github/workflows/   # CI/CD pipelines
├── turbo.json           # Turborepo config
└── pnpm-workspace.yaml  # Workspace config
```

**Key architecture decisions:**

- **Monorepo with shared package**: Types and validation schemas are defined once in `packages/shared` and consumed by both frontend and backend. This eliminates type drift and ensures validation rules are consistent.
- **Expo Router (file-based routing)**: Route groups `(auth)` and `(app)` provide clean separation of authenticated and unauthenticated flows with automatic redirects.
- **Zustand over Context**: Provides surgical re-renders (components only update when their subscribed data changes), built-in async support, and minimal boilerplate.
- **Prisma + NeonDB**: Type-safe database queries with auto-generated types. NeonDB provides serverless PostgreSQL that pairs well with Vercel's serverless functions.
- **JWT with refresh token rotation**: Access tokens expire in 15 minutes. Refresh tokens are rotated on every use and stored securely via `expo-secure-store`.
- **Material You dynamic theming**: On Android 12+, the app reads the device's wallpaper-derived color palette. Falls back to a seed color on older devices/iOS.
- **Vercel serverless deployment**: The Express app is wrapped as a single serverless function, avoiding cold start multiplication.

## Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- A [NeonDB](https://neon.tech) database (free tier)
- Android Studio / Expo dev client (for mobile development)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Ovo.git
cd Ovo
pnpm install
```

### 2. Configure Environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your NeonDB URL and JWT secret

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
# Edit apps/mobile/.env with your backend URL
```

Generate a JWT secret:
```bash
openssl rand -hex 64
```

### 3. Set Up Database

```bash
pnpm --filter @ovo/backend db:generate   # Generate Prisma client
pnpm --filter @ovo/backend db:push       # Push schema to NeonDB
```

### 4. Run Development Servers

```bash
# Run both backend and mobile in parallel
pnpm dev

# Or individually
pnpm dev:backend   # Express API on http://localhost:3001
pnpm dev:app       # Expo dev server
```

## API Documentation

Base URL: `/api`

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ name, email, password }` | Register new user |
| POST | `/auth/login` | `{ email, password }` | Login, returns JWT tokens |
| POST | `/auth/refresh` | `{ refreshToken }` | Refresh access token |
| POST | `/auth/logout` | `{ refreshToken }` | Invalidate refresh token |

### Tasks (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (supports `?status`, `?priority`, `?search`, `?page`, `?limit`, `?sortBy`, `?sortOrder`) |
| GET | `/tasks/stats` | Get task completion statistics |
| GET | `/tasks/:id` | Get single task |
| POST | `/tasks` | Create task (`{ title, description?, status?, priority?, dueDate? }`) |
| PUT | `/tasks/:id` | Update task (partial update) |
| DELETE | `/tasks/:id` | Delete task |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/profile` | Get authenticated user's profile |

All responses follow the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

## Deployment

### Backend (Vercel)

```bash
cd apps/backend
npx vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — NeonDB connection string
- `JWT_ACCESS_SECRET` — your generated secret
- `CORS_ORIGIN` — your app's domain (or `*` for development)

### Mobile (APK)

APKs are automatically built by GitHub Actions on push to `main`. To build locally:

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### CI/CD — GitHub Secrets for APK Signing

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

Generate a keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore upload.keystore \
  -alias ovo -keyalg RSA -keysize 2048 -validity 10000

# Encode for GitHub Secrets:
base64 -w 0 upload.keystore
```

## License

This project is licensed under the **GNU General Public License v3.0** — see [LICENSE](./LICENSE) for details.
