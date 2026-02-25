// Ovo — Smart Task Manager
// OpenAPI 3.0.0 Specification
// SPDX-License-Identifier: GPL-3.0

import type { JsonObject } from "swagger-ui-express";

const swaggerDocument: JsonObject = {
  openapi: "3.0.0",
  info: {
    title: "Ovo API",
    version: "0.1.0",
    description:
      "REST API for Ovo — a smart task manager built with Express.js, Prisma, and NeonDB.",
    license: {
      name: "GPL-3.0",
      url: "https://www.gnu.org/licenses/gpl-3.0.html",
    },
    contact: {
      name: "Arnav",
      url: "https://github.com/NotoriousArnav/Ovo",
    },
  },
  servers: [
    {
      url: "https://ovo-backend.vercel.app",
      description: "Production (Vercel)",
    },
    {
      url: "http://localhost:3001",
      description: "Development",
    },
  ],
  tags: [
    { name: "Health", description: "Server health check" },
    { name: "Auth", description: "Authentication and token management" },
    { name: "Tasks", description: "Task CRUD and statistics" },
    { name: "User", description: "User profile" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token (15-minute expiry)",
      },
    },
    schemas: {
      // ─── Models ──────────────────────────────────────
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm5abc123def456" },
          name: { type: "string", example: "Arnav Sharma" },
          email: { type: "string", format: "email", example: "arnav@example.com" },
          createdAt: { type: "string", format: "date-time", example: "2025-01-15T12:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2025-01-15T12:00:00.000Z" },
        },
        required: ["id", "name", "email", "createdAt", "updatedAt"],
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm5task001" },
          title: { type: "string", example: "Write documentation" },
          description: { type: "string", example: "Create comprehensive API docs" },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed"],
            example: "in_progress",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            example: "high",
          },
          dueDate: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2025-02-01T00:00:00.000Z",
          },
          userId: { type: "string", example: "cm5abc123def456" },
          createdAt: { type: "string", format: "date-time", example: "2025-01-15T12:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2025-01-15T14:30:00.000Z" },
        },
        required: ["id", "title", "description", "status", "priority", "dueDate", "userId", "createdAt", "updatedAt"],
      },
      TaskStats: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          pending: { type: "integer", example: 10 },
          inProgress: { type: "integer", example: 15 },
          completed: { type: "integer", example: 17 },
          completionRate: {
            type: "integer",
            description: "Percentage of completed tasks (0-100)",
            example: 40,
          },
        },
        required: ["total", "pending", "inProgress", "completed", "completionRate"],
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
          refreshToken: { type: "string", example: "a1b2c3d4e5f6..." },
        },
        required: ["accessToken", "refreshToken"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          tokens: { $ref: "#/components/schemas/AuthTokens" },
        },
        required: ["user", "tokens"],
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 3 },
        },
        required: ["page", "limit", "total", "totalPages"],
      },

      // ─── Enums ───────────────────────────────────────
      TaskStatus: {
        type: "string",
        enum: ["pending", "in_progress", "completed"],
      },
      TaskPriority: {
        type: "string",
        enum: ["low", "medium", "high"],
      },

      // ─── Error Responses ─────────────────────────────
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error description" },
        },
        required: ["success", "message"],
      },
      ValidationError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
            example: { email: ["Invalid email address"], password: ["Password must be at least 8 characters"] },
          },
        },
        required: ["success", "message", "errors"],
      },
    },
  },

  // ─── Paths ─────────────────────────────────────────────
  paths: {
    // ── Health ──
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns server status and timestamp.",
        responses: {
          "200": {
            description: "Server is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Ovo API is running" },
                    timestamp: { type: "string", format: "date-time", example: "2025-01-15T12:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Auth: Register ──
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Creates a new user account and returns JWT tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    minLength: 2,
                    maxLength: 50,
                    example: "Arnav Sharma",
                    description: "Full name (2-50 characters, trimmed)",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "arnav@example.com",
                    description: "Email address (trimmed, lowercased)",
                  },
                  password: {
                    type: "string",
                    minLength: 8,
                    maxLength: 128,
                    example: "SecurePass123",
                    description: "Password (8-128 chars, must have uppercase + lowercase + digit)",
                  },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/LoginResponse" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "409": {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  success: false,
                  message: "An account with this email already exists",
                },
              },
            },
          },
        },
      },
    },

    // ── Auth: Login ──
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticates a user and returns JWT tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "arnav@example.com",
                    description: "Email address (trimmed, lowercased)",
                  },
                  password: {
                    type: "string",
                    minLength: 1,
                    example: "SecurePass123",
                    description: "Password",
                  },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/LoginResponse" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "Invalid email or password" },
              },
            },
          },
        },
      },
    },

    // ── Auth: Refresh ──
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh tokens",
        description:
          "Exchanges a valid refresh token for a new access token and a new refresh token. The old refresh token is deleted (rotation).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: {
                    type: "string",
                    minLength: 1,
                    example: "a1b2c3d4e5f6...",
                    description: "Current refresh token",
                  },
                },
                required: ["refreshToken"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens refreshed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/AuthTokens" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "Invalid refresh token" },
              },
            },
          },
        },
      },
    },

    // ── Auth: Logout ──
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Invalidates the provided refresh token by deleting it from the database.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: {
                    type: "string",
                    example: "a1b2c3d4e5f6...",
                    description: "Refresh token to invalidate",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Logged out successfully" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Tasks: List ──
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks",
        description:
          "Returns the authenticated user's tasks with filtering, search, sorting, and pagination.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/TaskStatus" },
            description: "Filter by status",
          },
          {
            name: "priority",
            in: "query",
            schema: { $ref: "#/components/schemas/TaskPriority" },
            description: "Filter by priority",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string", maxLength: 200 },
            description: "Search in title and description (case-insensitive)",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Items per page",
          },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: ["createdAt", "dueDate", "priority", "title"],
              default: "createdAt",
            },
            description: "Sort field",
          },
          {
            name: "sortOrder",
            in: "query",
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
            description: "Sort direction",
          },
        ],
        responses: {
          "200": {
            description: "Paginated task list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Task" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "Authentication required" },
              },
            },
          },
        },
      },

      // ── Tasks: Create ──
      post: {
        tags: ["Tasks"],
        summary: "Create a task",
        description: "Creates a new task for the authenticated user.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                    example: "Review pull requests",
                    description: "Task title (1-200 characters, trimmed)",
                  },
                  description: {
                    type: "string",
                    maxLength: 2000,
                    default: "",
                    example: "Check open PRs on the Ovo repo",
                    description: "Task description (max 2000 characters, trimmed)",
                  },
                  status: {
                    $ref: "#/components/schemas/TaskStatus",
                    default: "pending",
                    description: "Initial status (defaults to pending)",
                  },
                  priority: {
                    $ref: "#/components/schemas/TaskPriority",
                    default: "medium",
                    description: "Priority level (defaults to medium)",
                  },
                  dueDate: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    example: "2025-02-15T00:00:00.000Z",
                    description: "Due date (ISO 8601 datetime or null)",
                  },
                },
                required: ["title"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Task created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },

    // ── Tasks: Stats ──
    "/api/tasks/stats": {
      get: {
        tags: ["Tasks"],
        summary: "Task statistics",
        description:
          "Returns task counts and completion rate for the authenticated user.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Task statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/TaskStats" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },

    // ── Tasks: Get / Update / Delete ──
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get a task",
        description: "Returns a single task by ID. Only tasks owned by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Task CUID",
          },
        ],
        responses: {
          "200": {
            description: "Task found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "404": {
            description: "Task not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "Task not found" },
              },
            },
          },
        },
      },

      put: {
        tags: ["Tasks"],
        summary: "Update a task",
        description:
          "Partially updates a task. Only the fields included in the body will be changed. Only tasks owned by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Task CUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                    description: "Task title (1-200 characters, trimmed)",
                  },
                  description: {
                    type: "string",
                    maxLength: 2000,
                    description: "Task description (max 2000 characters, trimmed)",
                  },
                  status: { $ref: "#/components/schemas/TaskStatus" },
                  priority: { $ref: "#/components/schemas/TaskPriority" },
                  dueDate: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    description: "Due date (ISO 8601 datetime or null)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Task updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "404": {
            description: "Task not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "Task not found" },
              },
            },
          },
        },
      },

      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        description: "Deletes a task permanently. Only tasks owned by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Task CUID",
          },
        ],
        responses: {
          "200": {
            description: "Task deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Task deleted successfully" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "404": {
            description: "Task not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "Task not found" },
              },
            },
          },
        },
      },
    },

    // ── User: Profile ──
    "/api/user/profile": {
      get: {
        tags: ["User"],
        summary: "Get user profile",
        description: "Returns the authenticated user's profile.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { success: false, message: "User not found" },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerDocument;
