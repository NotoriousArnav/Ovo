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
| `AI_PROVIDER` | `groq` | No (only for AI daily summary) |
| `AI_MODEL` | `llama-3.3-70b-versatile` | No (only for AI daily summary) |
| `GROQ_API_KEY` | Groq API key | No (only for AI daily summary) |
| `AI_RATE_LIMIT_ENABLED` | `true` | No |
| `AI_RATE_LIMIT_MAX` | `20` | No |
| `AI_RATE_LIMIT_WINDOW_MS` | `3600000` | No |
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

The release step uses [`softprops/action-gh-release@v2`](https://github.com/softprops/action-gh-release) with `append_body: true` so the APK and MCP workflows don't overwrite each other's release notes.

### MCP Binary Build Pipeline (`.github/workflows/build-mcp.yml`)

Runs on every push to `main` and on manual dispatch. Builds standalone [Single Executable Application (SEA)](https://nodejs.org/api/single-executable-applications.html) binaries — no Node.js installation required on the target machine.

**Permissions**: `contents: write` (required for creating/appending to GitHub Releases).

**Build matrix (6 targets):**

| Label | Runner | Cross-compiled? |
|-------|--------|-----------------|
| `linux-x64` | `ubuntu-latest` | No |
| `linux-arm64` | `ubuntu-24.04-arm` | No |
| `darwin-arm64` | `macos-latest` | No |
| `darwin-x64` | `macos-15-intel` | No |
| `win-x64` | `windows-latest` | No |
| `win-arm64` | `ubuntu-latest` | Yes — downloads Node v22 win-arm64 binary |

**Build process (per target):**

1. Checkout, setup pnpm/Node 22, install dependencies
2. **Bundle** — `pnpm --filter @ovo/mcp build:bundle` (esbuild bundles the entire app into a single JS file)
3. **Generate SEA blob** — `node --experimental-sea-config sea-config.json` produces a binary blob from the bundle
4. **Inject into Node binary** — copies the platform's `node` binary, strips existing code signatures (macOS/Windows), then uses `postject` to inject the SEA blob with the `NODE_SEA_FUSE` sentinel
5. **Re-sign** — on macOS, re-signs with ad-hoc signature (`codesign --sign -`)
6. **Rename** — appends platform label and commit short SHA (e.g., `ovo-mcp-linux-x64-abc1234`)
7. **Upload artifact** — 30-day retention
8. **Release job** — downloads all 6 binaries and attaches them to the GitHub Release (same commit-SHA tag used by the APK workflow), using `append_body: true`

For `win-arm64` cross-compilation, the workflow runs on `ubuntu-latest`, downloads a Node v22 Windows ARM64 binary from `nodejs.org`, and injects the blob into that binary instead of the runner's own `node`.

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
| `GROQ_API_KEY` | Your Groq key (or omit to disable AI) | Your Groq key |
| `AI_PROVIDER` | `groq` | `groq` |
| `AI_MODEL` | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` |

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

---

## Rollback

### Backend (Vercel)

Vercel keeps every deployment. To rollback:

1. Open the Vercel dashboard → Deployments tab
2. Find the last known-good deployment
3. Click the three-dot menu → **Promote to Production**

### Web App (Netlify)

Netlify also keeps deploy history:

1. Open the Netlify dashboard → Deploys tab
2. Click the deploy you want to restore
3. Click **Publish deploy**

### Mobile / MCP Binaries (GitHub Releases)

Each push to `main` creates a new release tagged by commit SHA. To rollback:

1. Go to [GitHub Releases](https://github.com/NotoriousArnav/Ovo/releases)
2. Find the release corresponding to the last known-good commit
3. Download the APK or MCP binary from that release
4. Distribute manually or point Obtainium users to the specific release

---

## Monitoring & Logging

### Backend

- **Vercel function logs**: Vercel Dashboard → your project → Logs tab. Shows `console.log`/`console.error` output from the serverless function. Logs are ephemeral (not persisted long-term).
- **Request logging**: In development, `morgan` logs every request in `dev` format to stdout. In production (`NODE_ENV=production`), morgan is not active.
- **Prisma query logging**: In development, Prisma logs all SQL queries to stdout. In production, only errors are logged.

### Web App

- **Netlify build logs**: Netlify Dashboard → Deploys → click a deploy to see the full build output.
- **Runtime**: The web app is a static SPA — no server-side logs. Use browser DevTools (Console, Network) for debugging.

### GitHub Actions

- All workflow runs are visible at **Actions** tab in the GitHub repository. Each job shows step-by-step output with timestamps.

---

## Production Database Notes

Ovo currently uses `prisma db push` for schema management. This works well for small teams and solo projects:

- **`db push`** applies the Prisma schema directly to the database — no migration files, no migration history table.
- It's fast and frictionless for development: change the schema, run `db:push`, done.
- **Downside**: There's no record of what changed or when. Schema changes can't be reviewed in PRs.

**For larger teams or production-critical deployments**, consider switching to `prisma migrate`:

```bash
# Create a migration (generates SQL in prisma/migrations/)
pnpm --filter @ovo/backend db:migrate

# Apply pending migrations in production
pnpm --filter @ovo/backend prisma migrate deploy
```

Migration files are version-controlled and can be reviewed in pull requests. The `db:migrate` script is already configured in the backend's `package.json`.
