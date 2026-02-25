// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

// ─── User ────────────────────────────────────────────
export type AuthProvider = "local" | "eventhorizon";

export interface User {
  id: string;
  name: string;
  email: string;
  authProvider?: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

// ─── Task ────────────────────────────────────────────
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Auth ────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Task Filters ────────────────────────────────────
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "dueDate" | "priority" | "title";
  sortOrder?: "asc" | "desc";
}

// ─── Task Stats ──────────────────────────────────────
export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

// ─── API Keys ────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  /** The raw key — shown only once on creation, never stored or retrievable again. */
  key: string;
}

// ─── Notification Settings ────────────────────────────
export interface NotificationSettings {
  hour: number;   // 0-23
  minute: number; // 0-59
}

// ─── AI / Daily Summary ──────────────────────────────
export interface DailySummaryFocusTask {
  id: string;
  title: string;
  reason: string;
}

export interface DailySummary {
  summary: string;
  focusTasks: DailySummaryFocusTask[];
  encouragement: string;
  generatedAt: string;
}
