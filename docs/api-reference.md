# API Reference

Complete reference for the Ovo REST API. All endpoints are prefixed with `/api`.

**Base URLs:**

| Environment | URL |
|-------------|-----|
| Production | `https://ovo-backend.vercel.app` |
| Development | `http://localhost:3001` |

## Authentication

Protected endpoints require a JWT access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Access tokens expire after **15 minutes**. Use the [refresh endpoint](#post-apiauthrefresh) to obtain a new one.

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
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
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
curl https://ovo-backend.vercel.app/api/user/profile \
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

---

## Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/refresh` | No | Refresh tokens |
| `POST` | `/api/auth/logout` | No | Logout (invalidate refresh token) |
| `GET` | `/api/tasks` | Yes | List tasks (filtered, paginated, sorted) |
| `GET` | `/api/tasks/stats` | Yes | Task statistics |
| `GET` | `/api/tasks/:id` | Yes | Get single task |
| `POST` | `/api/tasks` | Yes | Create task |
| `PUT` | `/api/tasks/:id` | Yes | Update task |
| `DELETE` | `/api/tasks/:id` | Yes | Delete task |
| `GET` | `/api/user/profile` | Yes | Get user profile |
