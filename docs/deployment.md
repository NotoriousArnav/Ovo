# Deployment

This guide covers deploying the Ovo backend to Vercel, the mobile APK build pipeline via GitHub Actions, and environment configuration for different environments.

## Backend on Vercel

The Express.js backend is deployed as a single Vercel serverless function.

### How It Works

Vercel's configuration (`apps/backend/vercel.json`) wraps the Express app in a serverless function:

```json
{
  "version": 2,
  "framework": null,
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "npx prisma generate",
  "outputDirectory": ".",
  "functions": {
    "api/index.ts": {
      "memory": 256,
      "maxDuration": 10,
      "includeFiles": "src/**,prisma/**,node_modules/.prisma/**,node_modules/@prisma/client/**"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" }
  ]
}
```

Key details:

- **Entry point**: `api/index.ts` imports the Express app and exports it as the default handler.
- **Rewrite rule**: All `/api/*` requests are routed to the single serverless function.
- **Install command**: Runs `pnpm install` from the monorepo root to resolve all workspace dependencies.
- **Build command**: Only runs `npx prisma generate` to create the Prisma client — TypeScript is compiled at runtime by Vercel.
- **includeFiles**: Explicitly bundles `src/`, `prisma/`, and the Prisma client binaries into the serverless function.
- **Limits**: 256MB memory, 10-second max execution time.

### Environment Variables (Vercel Dashboard)

Set these in **Vercel Dashboard > Project Settings > Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | NeonDB connection string | Yes |
| `JWT_ACCESS_SECRET` | Random 64-char hex | Yes |
| `JWT_REFRESH_SECRET` | Random 64-char hex | Yes |
| `NODE_ENV` | `production` | Yes |
| `CORS_ORIGIN` | `*` (or restrict to your domain) | No |
| `EH_CLIENT_ID` | Event Horizon OAuth client ID | No (only for EH SSO) |
| `EH_CLIENT_SECRET` | Event Horizon OAuth client secret | No (only for EH SSO) |
| `EH_URL` | Event Horizon instance URL (e.g. `https://events.neopanda.tech`) | No (only for EH SSO) |
| `EH_ALLOWED_REDIRECTS` | Comma-separated allowlist of client OAuth redirect URIs | No (only for EH SSO) |
| `BASE_URL` | Public backend URL (e.g. `https://ovo-backend.vercel.app`) | No (only for EH SSO) |

`BASE_URL` exists because Vercel's auto-set `VERCEL_URL` resolves to unique preview deploy URLs (like `ovo-backend-abc123.vercel.app`), which break OAuth since Event Horizon only has the production callback URL registered. Set `BASE_URL` to your stable production URL.

### Deploy

If using the Vercel CLI:

```bash
cd apps/backend
npx vercel --prod
```

Or connect the GitHub repository in the Vercel dashboard for auto-deploy on push.

### The `@ovo/shared` Problem

Vercel's serverless bundler cannot resolve pnpm workspace symlinks (`workspace:*`). The backend originally imported from `@ovo/shared`, but this broke in production.

**Fix**: The shared code was inlined into `apps/backend/src/shared/`. The backend's `package.json` does not list `@ovo/shared` as a dependency. See [Shared Package](./shared-package.md) for the full story.

---

## Web App on Netlify

The Vue 3 SPA is deployed as a static site on Netlify.

### How It Works

A `netlify.toml` at the repo root configures the build:

```toml
[build]
  base = "apps/web"
  command = "cd ../.. && pnpm install && pnpm --filter @ovo/web build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Key details:

- **Base directory**: `apps/web` — Netlify runs from here
- **Build command**: Installs from monorepo root, then builds the web app
- **Publish directory**: `dist` (relative to base) — the Vite build output
- **SPA redirect**: All routes fall through to `index.html` for client-side routing

### Environment Variables (Netlify Dashboard)

Set these in **Netlify Dashboard > Site settings > Environment variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://ovo-backend.vercel.app/api` | Yes |
| `NODE_VERSION` | `20` | Recommended |

### Deploy

Connect the GitHub repository in the Netlify dashboard. Set the base directory to `apps/web`. Netlify auto-deploys on push to `main`.

Or deploy manually:

```bash
pnpm --filter @ovo/web build
# Upload apps/web/dist/ to any static host
```

### Web Environment Configuration

| Variable | Development | Production |
|----------|------------|------------|
| `VITE_API_URL` | `http://localhost:3001/api` | `https://ovo-backend.vercel.app/api` |

---

## GitHub Actions Workflows

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push to `main` and on pull requests targeting `main`.

**Steps:**
1. Checkout code
2. Set up pnpm (version from `packageManager` field in root `package.json`)
3. Set up Node.js 20 with pnpm cache
4. Install dependencies (`pnpm install --frozen-lockfile`)
5. Generate Prisma client
6. Run backend type-check (`pnpm --filter @ovo/backend typecheck`)

The mobile typecheck is skipped in CI because it requires Expo native modules that aren't available in the GitHub Actions runner environment.

### APK Build Pipeline (`.github/workflows/build-apk.yml`)

Runs on every push to `main` and on manual dispatch (`workflow_dispatch`).

**Permissions**: `contents: write` (required for creating GitHub Releases).

**Steps:**
1. Checkout code
2. Set up pnpm, Node.js 20, Java 17 (Temurin)
3. Install dependencies from monorepo root
4. Write `.env` with `EXPO_PUBLIC_API_URL` pointing to production backend
5. Run `expo prebuild --platform android --clean`
6. Make `gradlew` executable
7. *(Optional)* Decode keystore and configure signing (if secrets are set)
8. Build release APK with Gradle (`assembleRelease`)
9. Upload APK as GitHub Actions artifact (30-day retention)
10. Read version from `app.json`
11. Create a GitHub Release tagged `v{version}-{run_number}` with the APK attached

The release step uses [`softprops/action-gh-release@v2`](https://github.com/softprops/action-gh-release).

---

## APK Signing

### Unsigned Builds (Default)

Without signing configuration, the APK is built with the default Android debug keystore. This works for development and testing but will show an "untrusted app" warning on installation.

### Signed Builds

To enable signed builds, configure these GitHub repository secrets:

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.keystore` file | See below |
| `ANDROID_KEYSTORE_PASSWORD` | Password for the keystore | Set during generation |
| `ANDROID_KEY_ALIAS` | Key alias name | Set during generation |
| `ANDROID_KEY_PASSWORD` | Password for the key | Set during generation |

### Generate a Keystore

```bash
# Generate the keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore upload.keystore \
  -alias ovo \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Encode for GitHub Secrets
base64 -w 0 upload.keystore
# Copy the output and set it as ANDROID_KEYSTORE_BASE64
```

The workflow automatically detects whether signing secrets are configured and applies signing only when they're available.

---

## Environment Configuration

### Backend Environments

| Variable | Development | Production |
|----------|------------|------------|
| `DATABASE_URL` | Local or NeonDB dev branch | NeonDB production |
| `JWT_ACCESS_SECRET` | Any random value | Strong random hex |
| `JWT_REFRESH_SECRET` | Any random value | Strong random hex |
| `NODE_ENV` | `development` | `production` |
| `CORS_ORIGIN` | `*` | Restrict as needed |
| `PORT` | `3001` | Set by Vercel |

In development, `morgan` logs requests in `dev` format and Prisma logs queries. In production, only errors are logged.

### Mobile Environments

| Variable | Development | Production |
|----------|------------|------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001` | `https://ovo-backend.vercel.app` |

To switch environments, update `apps/mobile/.env` before building:

```bash
# Development (local backend)
echo "EXPO_PUBLIC_API_URL=http://localhost:3001" > apps/mobile/.env

# Production (Vercel backend)
echo "EXPO_PUBLIC_API_URL=https://ovo-backend.vercel.app" > apps/mobile/.env
```

The CI workflow always builds with the production URL.

---

## Verifying the Deployment

After deploying:

```bash
# 1. Check health
curl https://ovo-backend.vercel.app/api/health

# 2. Check Swagger UI (after swagger is set up)
# Open in browser: https://ovo-backend.vercel.app/api/docs

# 3. Check the latest GitHub Release
gh release list --repo NotoriousArnav/Ovo --limit 1
```
