# API Reference

Complete reference for the Ovo REST API. All endpoints are prefixed with `/api`. There are 20 endpoints total.

**Base URLs:**

| Environment | URL |
|-------------|-----|
| Production | `https://ovo-backend.vercel.app` |
| Development | `http://localhost:3001` |

> **Interactive API explorer:** The backend serves a [Swagger UI](https://ovo-backend.vercel.app/api/docs) at `/api/docs` with all endpoints, schemas, and a "Try it out" button. The raw [OpenAPI JSON](https://ovo-backend.vercel.app/api/docs.json) is at `/api/docs.json`.

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken or apiKey>
```

You can use either:
- **JWT access token** — obtained from login/register, expires after 15 minutes. Use the [refresh endpoint](#post-apiauthrefresh) to get a new one.
- **API key** — obtained from the [API keys endpoints](#api-keys) or the Profile page in the web/mobile app. Prefixed with `ovo_k_`, never expires. Revoke it when you no longer need it.

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Success (Paginated)

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  }
}
```

---

## Health

### `GET /api/health`

Health check endpoint. No authentication required.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Ovo API is running",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**curl**

```bash
curl https://ovo-backend.vercel.app/api/health
```

---

## Auth

### `POST /api/auth/register`

Create a new user account. Returns the user object and JWT tokens.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 2-50 characters, trimmed |
| `email` | string | Yes | Valid email, trimmed, lowercased |
| `password` | string | Yes | 8-128 characters, must contain at least one uppercase letter, one lowercase letter, and one digit |

**Response** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm5abc123def456",
      "name": "Arnav Sharma",
      "email": "arnav@example.com",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "a1b2c3d4e5f6..."
    }
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { "password": ["Password must contain at least one uppercase letter, one lowercase letter, and one number"] } }` |
| 409 | Email already exists | `{ "success": false, "message": "An account with this email already exists" }` |

**curl**

```bash
curl -X POST https://ovo-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arnav Sharma",
    "email": "arnav@example.com",
    "password": "SecurePass123"
  }'
```

---

### `POST /api/auth/login`

Authenticate an existing user. Returns the user object and JWT tokens.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email, trimmed, lowercased |
| `password` | string | Yes | Non-empty |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm5abc123def456",
      "name": "Arnav Sharma",
      "email": "arnav@example.com",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "a1b2c3d4e5f6..."
    }
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { ... } }` |
| 401 | Invalid credentials | `{ "success": false, "message": "Invalid email or password" }` |

**curl**

```bash
curl -X POST https://ovo-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "arnav@example.com",
    "password": "SecurePass123"
  }'
```

---

### `POST /api/auth/refresh`

Exchange a valid refresh token for a new access token and a new refresh token. The old refresh token is **deleted** (one-time use, rotation).

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Non-empty |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "x9y8z7w6v5u4..."
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { "refreshToken": ["Refresh token is required"] } }` |
| 401 | Invalid or expired token | `{ "success": false, "message": "Invalid refresh token" }` |

**curl**

```bash
curl -X POST https://ovo-backend.vercel.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6..."
  }'
```

---

### `POST /api/auth/logout`

Invalidate a refresh token. The token is deleted from the database. No authentication header required.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `refreshToken` | string | No | If omitted, the endpoint still returns 200 |

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**curl**

```bash
curl -X POST https://ovo-backend.vercel.app/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6..."
  }'
```

---

### `GET /api/auth/eventhorizon/login`

Initiates the Event Horizon OAuth2 + PKCE login flow. This is a **browser redirect endpoint** — it returns a 302, not JSON. Clients should navigate to this URL (not fetch it).

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `redirect_uri` | string | Yes | Where to send the user after authentication. Must be in the `EH_ALLOWED_REDIRECTS` allowlist. |

**Response** `302 Found`

Redirects the browser to the Event Horizon authorization page. After the user authenticates, Event Horizon redirects back to the callback endpoint below.

**Example URL**

```
https://ovo-backend.vercel.app/api/auth/eventhorizon/login?redirect_uri=https://ovo-tm.netlify.app/auth/eventhorizon/callback
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing or invalid `redirect_uri` | `{ "success": false, "message": "Validation failed", "errors": { ... } }` |
| 403 | `redirect_uri` not in allowlist | `{ "success": false, "message": "Redirect URI not allowed" }` |
| 500 | EH env vars not configured | `{ "success": false, "message": "Event Horizon OAuth is not configured" }` |

---

### `GET /api/auth/eventhorizon/callback`

OAuth2 callback endpoint. **Clients don't call this directly** — Event Horizon redirects here after the user authenticates. The backend exchanges the authorization code for tokens, fetches the user profile from EH, creates/links the Ovo user, and redirects back to the client with Ovo JWT tokens.

**Query Parameters** (set by Event Horizon)

| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Authorization code from Event Horizon |
| `state` | string | Signed JWT state parameter (contains redirect URI, nonce, PKCE code_verifier) |

**Response** `302 Found`

Redirects to `<redirect_uri>?access_token=<jwt>&refresh_token=<token>`. The client reads the tokens from the URL query parameters.

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `code` or `state` | `{ "success": false, "message": "Missing code or state" }` |
| 401 | Invalid or expired state JWT | `{ "success": false, "message": "Invalid state" }` |
| 502 | Event Horizon token exchange failed | `{ "success": false, "message": "Failed to exchange code" }` |

For the full OAuth flow diagram and architecture decisions, see [Event Horizon OAuth](./event-horizon-oauth.md).

---

## Tasks

All task endpoints require authentication (`Authorization: Bearer <token>`).

### `GET /api/tasks`

List the authenticated user's tasks with filtering, search, sorting, and pagination.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | enum | — | Filter by status: `pending`, `in_progress`, `completed` |
| `priority` | enum | — | Filter by priority: `low`, `medium`, `high` |
| `search` | string | — | Search in title and description (case-insensitive, max 200 chars) |
| `page` | integer | `1` | Page number (positive integer) |
| `limit` | integer | `20` | Items per page (1-100) |
| `sortBy` | enum | `createdAt` | Sort field: `createdAt`, `dueDate`, `priority`, `title` |
| `sortOrder` | enum | `desc` | Sort direction: `asc`, `desc` |

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5task001",
      "title": "Write documentation",
      "description": "Create comprehensive API docs",
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2025-02-01T00:00:00.000Z",
      "userId": "cm5abc123def456",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid query params | `{ "success": false, "message": "Validation failed", "errors": { ... } }` |
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |

**curl — basic (all tasks)**

```bash
curl https://ovo-backend.vercel.app/api/tasks \
  -H "Authorization: Bearer <accessToken>"
```

**curl — with filters**

```bash
curl "https://ovo-backend.vercel.app/api/tasks?status=pending&priority=high&page=1&limit=10&sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer <accessToken>"
```

**curl — with search**

```bash
curl "https://ovo-backend.vercel.app/api/tasks?search=documentation&sortBy=title&sortOrder=asc" \
  -H "Authorization: Bearer <accessToken>"
```

---

### `GET /api/tasks/stats`

Get task completion statistics for the authenticated user.

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "total": 42,
    "pending": 10,
    "inProgress": 15,
    "completed": 17,
    "completionRate": 40
  }
}
```

`completionRate` is an integer percentage: `Math.round((completed / total) * 100)`. Returns `0` if there are no tasks.

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |

**curl**

```bash
curl https://ovo-backend.vercel.app/api/tasks/stats \
  -H "Authorization: Bearer <accessToken>"
```

---

### `GET /api/tasks/:id`

Get a single task by ID. Only returns tasks owned by the authenticated user.

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Task CUID |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "title": "Write documentation",
    "description": "Create comprehensive API docs",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2025-02-01T00:00:00.000Z",
    "userId": "cm5abc123def456",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T14:30:00.000Z"
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 404 | Task not found or not owned by user | `{ "success": false, "message": "Task not found" }` |

**curl**

```bash
curl https://ovo-backend.vercel.app/api/tasks/cm5task001 \
  -H "Authorization: Bearer <accessToken>"
```

---

### `POST /api/tasks`

Create a new task for the authenticated user.

**Request Body**

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | — | 1-200 characters, trimmed |
| `description` | string | No | `""` | Max 2000 characters, trimmed |
| `status` | enum | No | `"pending"` | `pending`, `in_progress`, `completed` |
| `priority` | enum | No | `"medium"` | `low`, `medium`, `high` |
| `dueDate` | string \| null | No | — | ISO 8601 datetime or `null` |

**Response** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cm5task002",
    "title": "Review pull requests",
    "description": "Check open PRs on the Ovo repo",
    "status": "pending",
    "priority": "medium",
    "dueDate": null,
    "userId": "cm5abc123def456",
    "createdAt": "2025-01-15T15:00:00.000Z",
    "updatedAt": "2025-01-15T15:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { "title": ["Title is required"] } }` |
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |

**curl — minimal (title only)**

```bash
curl -X POST https://ovo-backend.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "title": "Review pull requests"
  }'
```

**curl — all fields**

```bash
curl -X POST https://ovo-backend.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "title": "Write unit tests",
    "description": "Add Jest tests for auth service",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2025-02-15T00:00:00.000Z"
  }'
```

---

### `PUT /api/tasks/:id`

Update an existing task. Only the fields you include in the body will be changed (partial update). Only works on tasks owned by the authenticated user.

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Task CUID |

**Request Body** (all fields optional)

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | 1-200 characters, trimmed |
| `description` | string | Max 2000 characters, trimmed |
| `status` | enum | `pending`, `in_progress`, `completed` |
| `priority` | enum | `low`, `medium`, `high` |
| `dueDate` | string \| null | ISO 8601 datetime or `null` |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cm5task001",
    "title": "Write documentation",
    "description": "Create comprehensive API docs",
    "status": "completed",
    "priority": "high",
    "dueDate": "2025-02-01T00:00:00.000Z",
    "userId": "cm5abc123def456",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-16T09:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { ... } }` |
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 404 | Task not found or not owned by user | `{ "success": false, "message": "Task not found" }` |

**curl — mark as completed**

```bash
curl -X PUT https://ovo-backend.vercel.app/api/tasks/cm5task001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "status": "completed"
  }'
```

**curl — update multiple fields**

```bash
curl -X PUT https://ovo-backend.vercel.app/api/tasks/cm5task001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "title": "Write docs (updated)",
    "priority": "low",
    "dueDate": null
  }'
```

---

### `DELETE /api/tasks/:id`

Delete a task. Only works on tasks owned by the authenticated user.

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Task CUID |

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 404 | Task not found or not owned by user | `{ "success": false, "message": "Task not found" }` |

**curl**

```bash
curl -X DELETE https://ovo-backend.vercel.app/api/tasks/cm5task001 \
  -H "Authorization: Bearer <accessToken>"
```

---

## User

### `GET /api/user/profile`

Get the authenticated user's profile.

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cm5abc123def456",
    "name": "Arnav Sharma",
    "email": "arnav@example.com",
    "authProvider": "local",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

`authProvider` is `"local"` for email/password users or `"eventhorizon"` for users who signed in via Event Horizon OAuth.

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 404 | User not found | `{ "success": false, "message": "User not found" }` |

**curl**

```bash
curl https://ovo-backend.vercel.app/api/user/profile \
  -H "Authorization: Bearer <accessToken>"
```

---

### `GET /api/user/notification-time`

Get the authenticated user's notification time settings (hour and minute for daily AI summary notifications).

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "notificationHour": 9,
    "notificationMinute": 0
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 404 | User not found | `{ "success": false, "message": "User not found" }` |

**curl**

```bash
curl https://ovo-backend.vercel.app/api/user/notification-time \
  -H "Authorization: Bearer <accessToken>"
```

---

### `PUT /api/user/notification-time`

Update the authenticated user's notification time. Used by mobile and MCP clients to configure when the daily summary notification fires.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `hour` | integer | Yes | 0-23 |
| `minute` | integer | Yes | 0-59 |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "notificationHour": 8,
    "notificationMinute": 30
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { "hour": ["Expected number, received string"] } }` |
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |

**curl**

```bash
curl -X PUT https://ovo-backend.vercel.app/api/user/notification-time \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "hour": 8,
    "minute": 30
  }'
```

---

## AI

All AI endpoints require authentication. The AI feature requires the `GROQ_API_KEY` environment variable to be set on the backend — if not configured, the endpoint returns 503 and clients should silently hide AI features.

### `GET /api/ai/daily-summary`

Get an AI-generated daily summary with your top 3 focus tasks, reasons, and encouragement. Results are **cached for one calendar day** per user — the first call triggers an LLM request, subsequent calls return the cached result.

Rate limited to 20 requests per user per hour (configurable via `AI_RATE_LIMIT_MAX` and `AI_RATE_LIMIT_WINDOW_MS` env vars).

**Rate limit headers** (included on every AI endpoint response):

| Header | Description | Example |
|--------|-------------|---------|
| `RateLimit-Limit` | Max requests allowed per window | `20` |
| `RateLimit-Remaining` | Requests remaining in current window | `17` |
| `RateLimit-Reset` | Seconds until the window resets | `3420` |

These follow the [IETF RateLimit header fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) standard (`standardHeaders: true` in express-rate-limit).

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "summary": "You have 5 tasks in flight. Focus on these 3 to make the most impact today:",
    "focusTasks": [
      {
        "id": "cm5task001",
        "title": "Write API documentation",
        "reason": "This is high priority and due tomorrow — knocking it out first frees up your afternoon."
      },
      {
        "id": "cm5task002",
        "title": "Review pull requests",
        "reason": "Two PRs have been waiting since Monday. Quick wins that unblock your teammates."
      },
      {
        "id": "cm5task003",
        "title": "Fix login bug",
        "reason": "High priority and already in progress — you're close to finishing this one."
      }
    ],
    "encouragement": "You've been making solid progress. Three focused tasks today and you'll be in great shape for the week.",
    "generatedAt": "2025-02-25T09:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 429 | Rate limit exceeded | `{ "success": false, "message": "Too many requests. Try again later." }` |
| 503 | AI not configured (`GROQ_API_KEY` not set) | `{ "success": false, "message": "AI features are not configured" }` |

**curl**

```bash
curl https://ovo-backend.vercel.app/api/ai/daily-summary \
  -H "Authorization: Bearer <accessToken>"
```

---

## API Keys

API keys provide long-lived authentication for programmatic access (e.g. the Ovo MCP server). All API key endpoints require JWT authentication — you can't use an API key to manage API keys.

### `POST /api/keys`

Create a new API key. The raw key is returned **once** in the response — store it securely. Maximum 10 keys per user.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-50 characters, trimmed |

**Response** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cm5key001",
    "name": "MCP Server",
    "keyPrefix": "ovo_k_a1b2c3",
    "createdAt": "2026-02-25T12:00:00.000Z",
    "key": "ovo_k_a1b2c3d4e5f6..."
  }
}
```

> The `key` field is the full raw key. It is only returned on creation — it's SHA-256 hashed in the database and can never be retrieved again.

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Validation failed or 10-key limit reached | `{ "success": false, "message": "Maximum of 10 API keys per user" }` |
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |

**curl**

```bash
curl -X POST https://ovo-backend.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "MCP Server"
  }'
```

---

### `GET /api/keys`

List all API keys for the authenticated user. Only metadata is returned — the raw key is never stored.

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "cm5key001",
      "name": "MCP Server",
      "keyPrefix": "ovo_k_a1b2c3",
      "lastUsedAt": "2026-02-25T14:00:00.000Z",
      "createdAt": "2026-02-25T12:00:00.000Z"
    }
  ]
}
```

**curl**

```bash
curl https://ovo-backend.vercel.app/api/keys \
  -H "Authorization: Bearer <accessToken>"
```

---

### `DELETE /api/keys/:id`

Revoke (permanently delete) an API key. The key immediately stops working.

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | API key CUID |

**Response** `200 OK`

```json
{
  "success": true,
  "message": "API key revoked"
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid token | `{ "success": false, "message": "Authentication required" }` |
| 404 | Key not found or not owned by user | `{ "success": false, "message": "API key not found" }` |

**curl**

```bash
curl -X DELETE https://ovo-backend.vercel.app/api/keys/cm5key001 \
  -H "Authorization: Bearer <accessToken>"
```

---

## End-to-End Example

Here's a complete flow: register, create a task, list tasks, and log out.

```bash
# 1. Register
RESPONSE=$(curl -s -X POST https://ovo-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "MyPassword123"
  }')

# Extract tokens (requires jq)
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.data.tokens.refreshToken')

echo "Access Token: $ACCESS_TOKEN"

# 2. Create a task
curl -s -X POST https://ovo-backend.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "My first task",
    "description": "Created via curl",
    "priority": "high"
  }' | jq .

# 3. List all tasks
curl -s https://ovo-backend.vercel.app/api/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 4. Get stats
curl -s https://ovo-backend.vercel.app/api/tasks/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 5. Logout
curl -s -X POST https://ovo-backend.vercel.app/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq .
```

### JavaScript (`fetch`)

The same flow using browser/Node.js `fetch()`:

```javascript
const API = "https://ovo-backend.vercel.app/api";

// 1. Register
const res = await fetch(`${API}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test User",
    email: "test@example.com",
    password: "MyPassword123",
  }),
});
const { data } = await res.json();
const accessToken = data.tokens.accessToken;

// 2. Create a task
await fetch(`${API}/tasks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    title: "My first task",
    description: "Created via fetch",
    priority: "high",
  }),
});

// 3. List all tasks
const tasks = await fetch(`${API}/tasks`, {
  headers: { Authorization: `Bearer ${accessToken}` },
}).then((r) => r.json());

console.log(tasks.data);
```

---

## Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/refresh` | No | Refresh tokens |
| `POST` | `/api/auth/logout` | No | Logout (invalidate refresh token) |
| `GET` | `/api/auth/eventhorizon/login` | No | Start Event Horizon OAuth flow (302 redirect) |
| `GET` | `/api/auth/eventhorizon/callback` | No | EH OAuth callback (302 redirect with tokens) |
| `GET` | `/api/tasks` | Yes | List tasks (filtered, paginated, sorted) |
| `GET` | `/api/tasks/stats` | Yes | Task statistics |
| `GET` | `/api/tasks/:id` | Yes | Get single task |
| `POST` | `/api/tasks` | Yes | Create task |
| `PUT` | `/api/tasks/:id` | Yes | Update task |
| `DELETE` | `/api/tasks/:id` | Yes | Delete task |
| `GET` | `/api/user/profile` | Yes | Get user profile |
| `GET` | `/api/user/notification-time` | Yes | Get notification time settings |
| `PUT` | `/api/user/notification-time` | Yes | Update notification time |
| `GET` | `/api/ai/daily-summary` | Yes | AI daily summary (cached, rate limited) |
| `POST` | `/api/keys` | Yes | Create API key |
| `GET` | `/api/keys` | Yes | List API keys |
| `DELETE` | `/api/keys/:id` | Yes | Revoke API key |
