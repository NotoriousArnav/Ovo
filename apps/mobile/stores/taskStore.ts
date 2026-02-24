// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { create } from "zustand";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskStats,
  CreateTaskInput,
  UpdateTaskInput,
} from "@ovo/shared";
import { taskService } from "../services/tasks";

interface TaskState {
  tasks: Task[];
  stats: TaskStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Filters
  statusFilter: TaskStatus | undefined;
  priorityFilter: TaskPriority | undefined;
  searchQuery: string;
  sortBy: "createdAt" | "dueDate" | "priority" | "title";
  sortOrder: "asc" | "desc";

  // Pagination
  page: number;
  totalPages: number;
  total: number;

  // Actions
  fetchTasks: (reset?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setStatusFilter: (status: TaskStatus | undefined) => void;
  setPriorityFilter: (priority: TaskPriority | undefined) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: "createdAt" | "dueDate" | "priority" | "title") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  statusFilter: undefined,
  priorityFilter: undefined,
  searchQuery: "",
  sortBy: "createdAt",
  sortOrder: "desc",

  page: 1,
  totalPages: 1,
  total: 0,

  fetchTasks: async (reset = true) => {
    const state = get();
    if (reset) {
      set({ isLoading: true, error: null });
    }

    try {
      const result = await taskService.getTasks({
        status: state.statusFilter,
        priority: state.priorityFilter,
        search: state.searchQuery || undefined,
        page: reset ? 1 : state.page,
        limit: 20,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      });

      set({
        tasks: reset ? result.data : [...state.tasks, ...result.data],
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: error.response?.data?.message || "Failed to fetch tasks",
      });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await taskService.getStats();
      set({ stats });
    } catch {
      // Silently fail — stats are non-critical
    }
  },

  createTask: async (input: CreateTaskInput) => {
    const task = await taskService.createTask(input);
    set((state) => ({
      tasks: [task, ...state.tasks],
      total: state.total + 1,
    }));
    // Refresh stats in background
    get().fetchStats();
    return task;
  },

  updateTask: async (id: string, input: UpdateTaskInput) => {
    const task = await taskService.updateTask(id, input);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    }));
    get().fetchStats();
    return task;
  },

  deleteTask: async (id: string) => {
    await taskService.deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      total: state.total - 1,
    }));
    get().fetchStats();
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status, page: 1 });
    get().fetchTasks(true);
  },

  setPriorityFilter: (priority) => {
    set({ priorityFilter: priority, page: 1 });
    get().fetchTasks(true);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, page: 1 });
    get().fetchTasks(true);
  },

  setSortBy: (sortBy) => {
    set({ sortBy, page: 1 });
    get().fetchTasks(true);
  },

  setSortOrder: (order) => {
    set({ sortOrder: order, page: 1 });
    get().fetchTasks(true);
  },

  loadMore: async () => {
    const state = get();
    if (state.page >= state.totalPages || state.isLoading) return;
    set({ page: state.page + 1 });
    await get().fetchTasks(false);
  },

  refresh: async () => {
    set({ isRefreshing: true, page: 1 });
    await Promise.all([get().fetchTasks(true), get().fetchStats()]);
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      tasks: [],
      stats: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      statusFilter: undefined,
      priorityFilter: undefined,
      searchQuery: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      totalPages: 1,
      total: 0,
    }),
}));
