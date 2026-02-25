// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ─── Task Schemas ────────────────────────────────────
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .trim()
    .default(""),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .trim()
    .optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const taskFiltersSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(["createdAt", "dueDate", "priority", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Inferred Types ──────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;

// ─── API Key Schemas ─────────────────────────────────
export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters")
    .trim(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// ─── Event Horizon OAuth ─────────────────────────────
export const ehLoginRedirectSchema = z.object({
  redirect_uri: z.string().url("Invalid redirect URI"),
});

export type EHLoginRedirectInput = z.infer<typeof ehLoginRedirectSchema>;

// ─── AI / Daily Summary Schemas ──────────────────────
export const dailySummaryFocusTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
});

export const dailySummaryResponseSchema = z.object({
  summary: z.string().describe("A short, ADHD-friendly overview of what the user should focus on today"),
  focusTasks: z
    .array(dailySummaryFocusTaskSchema)
    .min(1)
    .max(5)
    .describe("Top 3-5 tasks to focus on, ordered by urgency"),
  encouragement: z.string().describe("A brief, genuine encouragement — one sentence, no fluff"),
});

// ─── Notification Settings Schemas ───────────────────
export const notificationSettingsSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
