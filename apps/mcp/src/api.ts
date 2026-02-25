// Ovo — MCP Server
// HTTP client wrapper for the Ovo backend API
// SPDX-License-Identifier: GPL-3.0

// ─── Config ──────────────────────────────────────────

const API_URL = process.env.OVO_API_URL?.replace(/\/+$/, "");
const ACCESS_TOKEN = process.env.OVO_ACCESS_TOKEN;

if (!API_URL) {
  throw new Error(
    "OVO_API_URL is required. Set it to your Ovo backend URL (e.g. https://ovo-backend.vercel.app)"
  );
}

if (!ACCESS_TOKEN) {
  throw new Error(
    "OVO_ACCESS_TOKEN is required. Set it to a valid JWT access token from your Ovo account."
  );
}

// ─── Types ───────────────────────────────────────────
// Mirrors the backend response shapes — we don't import from @ovo/shared
// because the MCP server is intentionally decoupled (HTTP API mode).

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiPaginated<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ─── HTTP Client ─────────────────────────────────────

class OvoApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "OvoApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...options.headers,
    },
  });

  const body = await response.json() as (ApiSuccess<T> & ApiPaginated<T>) | ApiError;

  if (!response.ok || !body.success) {
    const err = body as ApiError;
    throw new OvoApiError(
      response.status,
      err.message || `API request failed: ${response.status}`,
      err.errors
    );
  }

  // Return the full body so callers can access .data, .pagination, etc.
  return body as unknown as T;
}

// ─── API Methods ─────────────────────────────────────

export interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export async function listTasks(
  filters: TaskFilters = {}
): Promise<{ data: Task[]; pagination: Pagination }> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  return request<{ data: Task[]; pagination: Pagination }>(
    `/api/tasks${qs ? `?${qs}` : ""}`
  );
}

export async function getTask(taskId: string): Promise<{ data: Task }> {
  return request<{ data: Task }>(`/api/tasks/${taskId}`);
}

export async function createTask(input: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}): Promise<{ data: Task }> {
  return request<{ data: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTask(
  taskId: string,
  input: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
  }
): Promise<{ data: Task }> {
  return request<{ data: Task }>(`/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteTask(
  taskId: string
): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function getStats(): Promise<{ data: TaskStats }> {
  return request<{ data: TaskStats }>("/api/tasks/stats");
}

export async function getProfile(): Promise<{ data: UserProfile }> {
  return request<{ data: UserProfile }>("/api/user/profile");
}
