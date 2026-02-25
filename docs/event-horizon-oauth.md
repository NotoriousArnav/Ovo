# Event Horizon (Community SSO)

Ovo supports "Sign in with Event Horizon" — an OAuth2 login flow that uses BroCode's own [Event Horizon](https://events.neopanda.tech) instance as the identity provider.

## Why Event Horizon?

BroCode already runs Event Horizon for community events at `events.neopanda.tech`. Instead of handing user data to Google or GitHub, Ovo uses the community's own infrastructure as its SSO provider. FOSS ecosystem eating its own dogfood — no third-party data leaks, no corporate OAuth gatekeepers.

If you're self-hosting Ovo, you can point it at your own Event Horizon instance (or skip it entirely — local email/password auth works fine on its own).

## How It Works

The backend owns the entire OAuth flow. Clients (web, mobile) just redirect to a backend endpoint — no client-side OAuth logic needed.

```
Client (web/mobile)
  │
  │  GET /api/auth/eventhorizon/login?redirect_uri=<where_to_return>
  │
  ▼
Backend
  │  1. Validates redirect_uri against EH_ALLOWED_REDIRECTS allowlist
  │  2. Generates PKCE code_verifier + code_challenge (S256)
  │  3. Creates a signed JWT "state" containing:
  │     - redirectUri (where to send the user after auth)
  │     - nonce (replay protection)
  │     - codeVerifier (for PKCE token exchange)
  │  4. 302 redirect to Event Horizon authorize endpoint
  │
  ▼
Event Horizon (events.neopanda.tech)
  │  User logs in / approves the app
  │  302 redirect to GET /api/auth/eventhorizon/callback?code=...&state=...
  │
  ▼
Backend (callback)
  │  1. Verifies the state JWT signature + expiry (5 min)
  │  2. Extracts the codeVerifier from the state
  │  3. POST to EH /o/token/ — exchanges authorization code + code_verifier for tokens
  │  4. GET EH /accounts/api/me/ — fetches user profile (name, email)
  │  5. Find-or-create Ovo user:
  │     - New email → create user with authProvider="eventhorizon", no password
  │     - Existing email → auto-link (update authProvider to "eventhorizon", log them in)
  │  6. Generate Ovo JWT access + refresh tokens
  │  7. 302 redirect to <redirect_uri>?access_token=...&refresh_token=...
  │
  ▼
Client
  │  Reads tokens from URL params
  │  Stores them (web: localStorage, mobile: expo-secure-store)
  │  Navigates to dashboard
```

### PKCE

Event Horizon requires PKCE (Proof Key for Code Exchange) with S256 challenge method. The backend generates the `code_verifier` and stores it inside the signed state JWT, so it survives the redirect round-trip without needing server-side session storage. This keeps the flow stateless and serverless-compatible.

### State JWT

Instead of storing OAuth state in a database or in-memory session, the backend signs a JWT containing the redirect URI, nonce, and PKCE code_verifier. This is set as the `state` parameter in the OAuth authorize request. When Event Horizon redirects back, the backend verifies the JWT signature and expiry (5 minutes) to prevent CSRF and replay attacks.

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| OAuth state management | Signed JWT (stateless) | Serverless-compatible, no DB/session needed, 5min expiry |
| PKCE | Required, S256 | Event Horizon requires it; code_verifier stored in state JWT |
| Mobile scheme | `ovo://` | Custom URL scheme configured in `app.json` |
| `passwordHash` | Nullable (`String?`) | OAuth-only users have no password |
| HTTP client for EH calls | Native `fetch` | Node 20+, no extra deps needed |
| OAuth flow ownership | Backend handles everything | Clients just redirect — no client-side OAuth complexity |
| Existing user with same email | Auto-link | Updates `authProvider` to `"eventhorizon"`, logs them in |
| Callback URL construction | Uses `BASE_URL` env var | Avoids Vercel preview deploy URL mismatches |

## Environment Variables

These are set on the backend (Vercel Dashboard or `.env`):

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EH_CLIENT_ID` | Yes (for EH) | OAuth client ID from Event Horizon | `your-client-id` |
| `EH_CLIENT_SECRET` | Yes (for EH) | OAuth client secret from Event Horizon | `your-client-secret` |
| `EH_URL` | Yes (for EH) | Base URL of your Event Horizon instance | `https://events.neopanda.tech` |
| `EH_ALLOWED_REDIRECTS` | Yes (for EH) | Comma-separated allowlist of client redirect URIs | `http://localhost:5173/auth/eventhorizon/callback,ovo://auth/callback,https://ovo-tm.netlify.app/auth/eventhorizon/callback` |
| `BASE_URL` | Yes (for EH) | Public base URL of the backend (used to build the OAuth callback URL) | `https://ovo-backend.vercel.app` |

All EH variables are optional — if they're not set, the EH login endpoints simply won't work, but local email/password auth is unaffected.

### Why `BASE_URL` instead of `VERCEL_URL`?

Vercel sets `VERCEL_URL` automatically, but on preview deploys it resolves to a unique URL like `ovo-backend-abc123.vercel.app`. This breaks OAuth because Event Horizon only has the production callback URL registered (`https://ovo-backend.vercel.app/api/auth/eventhorizon/callback`). Using a `BASE_URL` env var lets you control exactly which URL is used for OAuth callbacks.

## Registering Your Own Event Horizon OAuth App

If you're running your own Event Horizon instance:

1. Go to your EH admin or OAuth application management page
2. Create a new OAuth2 application:
   - **Client type**: Confidential
   - **Authorization grant type**: Authorization code
   - **Redirect URIs**: `https://your-backend.example.com/api/auth/eventhorizon/callback`
3. Copy the Client ID and Client Secret into your backend env vars
4. Set `EH_URL` to your Event Horizon instance URL
5. Set `EH_ALLOWED_REDIRECTS` to the client URLs that should be allowed to initiate the OAuth flow
6. Set `BASE_URL` to your backend's public URL

## Client Implementations

### Web (Vue 3)

The web app has a dedicated callback page at `/auth/eventhorizon/callback` (`apps/web/src/pages/EHCallbackPage.vue`). The login flow:

1. User clicks "Sign in with Event Horizon" on the login page
2. Browser navigates to `GET /api/auth/eventhorizon/login?redirect_uri=<origin>/auth/eventhorizon/callback`
3. After the OAuth dance, the backend redirects to `<origin>/auth/eventhorizon/callback?access_token=...&refresh_token=...`
4. The callback page reads the tokens from the URL query params, stores them, and navigates to the dashboard

### Mobile (Expo React Native)

The mobile app uses `expo-web-browser` to open the OAuth flow in an in-app browser:

1. User taps "Sign in with Event Horizon" on the login screen
2. The `eventHorizonLogin` action in the auth store opens `GET /api/auth/eventhorizon/login?redirect_uri=ovo://auth/callback` via `WebBrowser.openAuthSessionAsync()`
3. After the OAuth dance, the backend redirects to `ovo://auth/callback?access_token=...&refresh_token=...`
4. The app intercepts the deep link, reads the tokens, stores them in `expo-secure-store`, and navigates to the dashboard

The `ovo://` custom scheme is configured in `apps/mobile/app.json` under `"scheme": "ovo"`.

## Gotchas

- **Vercel preview URLs**: Preview deploys get unique URLs that won't match EH's registered redirect URI. OAuth only works on the production deploy (or localhost with the dev callback registered). This is why we use `BASE_URL`.
- **`EH_ALLOWED_REDIRECTS` allowlist**: Every client callback URL must be in this list, or the backend rejects the request. If you deploy the web app to a new domain, add it here.
- **OAuth-only users have no password**: Users who sign up via Event Horizon have `passwordHash: null` in the database. They can't use the email/password login endpoint. The `authProvider` field on the user model tracks how they signed up (`"local"` or `"eventhorizon"`).
- **Auto-linking**: If a user registers with email/password and later signs in with Event Horizon using the same email, their account is automatically linked — `authProvider` updates to `"eventhorizon"` and they're logged in. No duplicate accounts.
