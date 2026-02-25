// Ovo — Task store (Pinia)
// SPDX-License-Identifier: GPL-3.0

import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import type { Task, TaskFilters, TaskStats } from "@ovo/shared";
import type { CreateTaskInput, UpdateTaskInput } from "@ovo/shared";
import * as taskService from "@/services/tasks";

export const useTaskStore = defineStore("tasks", () => {
  const tasks = ref<Task[]>([]);
  const stats = ref<TaskStats | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const filters = reactive<TaskFilters>({
    status: undefined,
    priority: undefined,
    search: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  async function loadTasks(page = 1) {
    loading.value = true;
    error.value = null;
    try {
      const res = await taskService.fetchTasks({ ...filters, page, limit: pagination.limit });
      tasks.value = res.data;
      Object.assign(pagination, res.pagination);
    } catch (err: unknown) {
      error.value = extractError(err);
    } finally {
      loading.value = false;
    }
  }

  async function loadStats() {
    try {
      stats.value = await taskService.fetchTaskStats();
    } catch {
      // Silently fail stats
    }
  }

  async function addTask(data: CreateTaskInput): Promise<Task> {
    const task = await taskService.createTask(data);
    // Reload to keep pagination consistent
    await loadTasks(pagination.page);
    await loadStats();
    return task;
  }

  async function editTask(id: string, data: UpdateTaskInput): Promise<Task> {
    const task = await taskService.updateTask(id, data);
    const idx = tasks.value.findIndex((t) => t.id === id);
    if (idx !== -1) tasks.value[idx] = task;
    await loadStats();
    return task;
  }

  async function removeTask(id: string) {
    await taskService.deleteTask(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);
    await loadStats();
  }

  function setFilter(key: keyof TaskFilters, value: unknown) {
    (filters as Record<string, unknown>)[key] = value || undefined;
    loadTasks(1);
  }

  function clearFilters() {
    filters.status = undefined;
    filters.priority = undefined;
    filters.search = undefined;
    filters.sortBy = "createdAt";
    filters.sortOrder = "desc";
    loadTasks(1);
  }

  return {
    tasks, stats, loading, error, pagination, filters,
    loadTasks, loadStats, addTask, editTask, removeTask, setFilter, clearFilters,
  };
});

function extractError(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return "Failed to load tasks";
}
