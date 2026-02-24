// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type {
  Task,
  TaskFilters,
  TaskStats,
  ApiResponse,
  PaginatedResponse,
  CreateTaskInput,
  UpdateTaskInput,
} from "@ovo/shared";

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    const { data } = await api.get<PaginatedResponse<Task>>("/tasks", {
      params: filters,
    });
    return data;
  },

  async getTask(id: string): Promise<Task> {
    const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return data.data;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const { data } = await api.post<ApiResponse<Task>>("/tasks", input);
    return data.data;
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const { data } = await api.put<ApiResponse<Task>>(`/tasks/${id}`, input);
    return data.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getStats(): Promise<TaskStats> {
    const { data } = await api.get<ApiResponse<TaskStats>>("/tasks/stats");
    return data.data;
  },
};
