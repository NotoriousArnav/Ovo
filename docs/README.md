# Ovo Documentation

> **Ovo** is a full-stack smart task manager built with Expo React Native and Express.js, featuring Material You dynamic theming.

## Quick Links

| Resource | URL |
|----------|-----|
| Live API | [`https://ovo-backend.vercel.app/api/health`](https://ovo-backend.vercel.app/api/health) |
| Swagger UI | [`https://ovo-backend.vercel.app/api/docs`](https://ovo-backend.vercel.app/api/docs) |
| OpenAPI JSON | [`https://ovo-backend.vercel.app/api/docs.json`](https://ovo-backend.vercel.app/api/docs.json) |
| GitHub Releases (APK) | [`github.com/NotoriousArnav/Ovo/releases`](https://github.com/NotoriousArnav/Ovo/releases) |
| Repository | [`github.com/NotoriousArnav/Ovo`](https://github.com/NotoriousArnav/Ovo) |

## Table of Contents

1. **[Getting Started](./getting-started.md)** — Prerequisites, installation, environment variables, running the dev servers.

2. **[Architecture](./architecture.md)** — Monorepo layout, tech stack rationale, request lifecycle, authentication flow, state management.

3. **[API Reference](./api-reference.md)** — All 13 REST endpoints with request/response schemas, validation rules, and copy-pasteable curl examples.

4. **[Mobile App](./mobile-app.md)** — Screens, navigation structure, Material You theming, Zustand stores, API service layer, building the APK.

5. **[Deployment](./deployment.md)** — Backend on Vercel, GitHub Actions CI/CD workflows, APK signing with keystores, environment configuration.

6. **[Shared Package](./shared-package.md)** — What `@ovo/shared` contains, how pnpm workspace linking works, the Vercel serverless fix, and the current state of shared code.

## Project Structure

```
Ovo/
├── apps/
│   ├── backend/         # Express.js API (Prisma + NeonDB + JWT)
│   └── mobile/          # Expo SDK 54 React Native app
├── packages/
│   └── shared/          # Shared TypeScript types & Zod schemas
├── docs/                # This documentation
├── .github/workflows/   # CI (typecheck) + APK build workflows
├── turbo.json           # Turborepo task config
├── pnpm-workspace.yaml  # Workspace definition
└── package.json         # Root package with monorepo scripts
```

## License

This project is licensed under the [GNU General Public License v3.0](../LICENSE).
