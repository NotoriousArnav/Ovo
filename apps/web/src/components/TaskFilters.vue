<script setup lang="ts">
import { useTaskStore } from "@/stores/tasks";
import type { TaskStatus, TaskPriority } from "@ovo/shared";

const taskStore = useTaskStore();

const statuses: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const priorities: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const sortFields = [
  { value: "createdAt", label: "Created" },
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];

function handleStatusChange(e: Event) {
  taskStore.setFilter("status", (e.target as HTMLSelectElement).value as TaskStatus || undefined);
}

function handlePriorityChange(e: Event) {
  taskStore.setFilter("priority", (e.target as HTMLSelectElement).value as TaskPriority || undefined);
}

function handleSortChange(e: Event) {
  taskStore.setFilter("sortBy", (e.target as HTMLSelectElement).value);
}

function toggleSortOrder() {
  taskStore.setFilter("sortOrder", taskStore.filters.sortOrder === "desc" ? "asc" : "desc");
}
</script>

<template>
  <div class="task-filters">
    <select class="form-select filter-select" :value="taskStore.filters.status || ''" @change="handleStatusChange">
      <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
    </select>

    <select class="form-select filter-select" :value="taskStore.filters.priority || ''" @change="handlePriorityChange">
      <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
    </select>

    <select class="form-select filter-select" :value="taskStore.filters.sortBy" @change="handleSortChange">
      <option v-for="s in sortFields" :key="s.value" :value="s.value">{{ s.label }}</option>
    </select>

    <button class="btn btn-secondary btn-sm sort-toggle" @click="toggleSortOrder" :title="taskStore.filters.sortOrder === 'desc' ? 'Descending' : 'Ascending'">
      {{ taskStore.filters.sortOrder === "desc" ? "&#8595;" : "&#8593;" }}
    </button>

    <button
      v-if="taskStore.filters.status || taskStore.filters.priority || taskStore.filters.search"
      class="btn btn-text btn-sm"
      @click="taskStore.clearFilters()"
    >
      Clear
    </button>
  </div>
</template>

<style scoped>
.task-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  width: auto;
  min-width: 130px;
  padding: 8px 12px;
  font-size: 0.8125rem;
}

.sort-toggle {
  padding: 8px 12px;
  font-size: 1rem;
  min-height: unset;
}
</style>
