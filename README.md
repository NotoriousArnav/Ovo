# Ovo

A self-hosted task manager. Web, Android, one API. Your data, your server.

## Why?

I was tired of spoon-feeding Google my data in an organized way, and I'm too lazy to shift to Proton. I also needed a reason to start mobile development and try React Native — plus I got a task from an interviewer to build a Smart Task Manager. On top of that, I wanted to build a BroCode FOSS ecosystem. So here we are with Ovo.

## What You Get

- **Self-hosted** — deploy the backend anywhere that runs Node.js, bring your own Postgres
- **Cross-platform** — Vue 3 SPA for web, native Android APK, both talking to the same API
- **[Event Horizon (Community SSO)](docs/event-horizon-oauth.md)** — sign in with your BroCode account via OAuth2, no third-party identity providers needed
- **Material Design 3** — clean MD3 theming with automatic dark mode; on Android 12+, colors adapt to your wallpaper
- **Open source** — GPL-3.0, inspect/fork/self-host freely

## Quick Start

```bash
git clone https://github.com/NotoriousArnav/Ovo.git
cd Ovo
pnpm install

# Configure env
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
# Fill in DATABASE_URL, JWT secrets, VITE_API_URL, EXPO_PUBLIC_API_URL

# Database
pnpm --filter @ovo/backend db:generate
pnpm --filter @ovo/backend db:push

# Run everything
pnpm dev
```

Backend runs on `http://localhost:3001`, web app on `http://localhost:5173`. For the full setup walkthrough, see [Getting Started](docs/getting-started.md).

## Community

Ovo is built for the [BroCode Tech](https://brocode-tech.netlify.app/) community — an open tech community for developers, builders, and learners. We run workshops, hackathons, and build FOSS tools together.

- [Community Website](https://brocode-tech.netlify.app/)
- [Events (Event Horizon)](https://events.neopanda.tech)
- [GitHub](https://github.com/NotoriousArnav/Ovo)

## Documentation

| Document | What's in it |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Prerequisites, installation, env vars, dev servers |
| [Architecture](docs/architecture.md) | Monorepo layout, tech stack, auth flow, state management |
| [API Reference](docs/api-reference.md) | All 14 REST endpoints with schemas and curl examples |
| [Event Horizon OAuth](docs/event-horizon-oauth.md) | Community SSO setup, OAuth2 + PKCE flow, env config |
| [Mobile App](docs/mobile-app.md) | Screens, theming, stores, APK building |
| [Deployment](docs/deployment.md) | Vercel, Netlify, GitHub Actions, APK signing |
| [Shared Package](docs/shared-package.md) | Workspace linking, types, Vercel workaround |
| [Obtainium](docs/obtainium.md) | Auto-update Android app via Obtainium |

**Live API:** [Swagger UI](https://ovo-backend.vercel.app/api/docs) | [OpenAPI JSON](https://ovo-backend.vercel.app/api/docs.json)

## Roadmap

**Shipped:**
- Event Horizon (Community SSO) — OAuth2 + PKCE across web and mobile

**Planned:**
- **MCP Server** — expose tasks to AI assistants via [Model Context Protocol](https://modelcontextprotocol.io/)
- **Calendar Integration** — sync tasks with Google Calendar, Apple Calendar, CalDAV
- **LangChain Integration** — natural language task creation, smart prioritization, conversational queries over your tasks

## License

[GNU General Public License v3.0](./LICENSE)
