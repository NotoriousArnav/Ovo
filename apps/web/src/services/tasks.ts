// Ovo — Task API service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type {
  ApiResponse,
  PaginatedResponse,
  Task,
  TaskFilters,
  TaskStats,
} from "@ovo/shared";
import type { CreateTaskInput, UpdateTaskInput } from "@ovo/shared";

export async function fetchTasks(filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const res = await api.get<PaginatedResponse<Task>>("/tasks", { params });
  return res.data;
}

export async function fetchTask(id: string): Promise<Task> {
  const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
  return res.data.data;
}

export async function fetchTaskStats(): Promise<TaskStats> {
  const res = await api.get<ApiResponse<TaskStats>>("/tasks/stats");
  return res.data.data;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const res = await api.post<ApiResponse<Task>>("/tasks", data);
  return res.data.data;
}

export async function updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
  const res = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
