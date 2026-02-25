<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTaskStore } from "@/stores/tasks";
import type { Task } from "@ovo/shared";
import { ref } from "vue";

const props = defineProps<{ task: Task }>();
const router = useRouter();
const taskStore = useTaskStore();
const deleting = ref(false);

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && props.task.status !== "completed";
}

async function handleDelete() {
  if (!confirm("Delete this task?")) return;
  deleting.value = true;
  try {
    await taskStore.removeTask(props.task.id);
  } finally {
    deleting.value = false;
  }
}

async function toggleComplete() {
  const newStatus = props.task.status === "completed" ? "pending" : "completed";
  await taskStore.editTask(props.task.id, { status: newStatus });
}
</script>

<template>
  <div class="task-card card card-outlined" :class="{ 'task-completed': task.status === 'completed' }">
    <div class="task-card-left">
      <button
        class="check-btn"
        :class="{ checked: task.status === 'completed' }"
        @click="toggleComplete"
        :aria-label="task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'"
      >
        <span v-if="task.status === 'completed'">&#10003;</span>
      </button>
    </div>

    <div class="task-card-body" @click="router.push(`/dashboard/tasks/${task.id}/edit`)">
      <div class="task-title">{{ task.title }}</div>
      <div v-if="task.description" class="task-desc text-sm text-muted">
        {{ task.description.length > 100 ? task.description.slice(0, 100) + "..." : task.description }}
      </div>
      <div class="task-meta">
        <span class="badge" :class="`badge-${task.status.replace('_', '-')}`">
          {{ statusLabels[task.status] }}
        </span>
        <span class="badge" :class="`badge-${task.priority}`">
          {{ priorityLabels[task.priority] }}
        </span>
        <span class="text-xs text-muted" :class="{ 'text-error': isOverdue(task.dueDate) }">
          {{ formatDate(task.dueDate) }}
        </span>
      </div>
    </div>

    <div class="task-card-actions">
      <button class="btn btn-icon btn-text btn-sm" @click="router.push(`/dashboard/tasks/${task.id}/edit`)" aria-label="Edit task">
        &#9998;
      </button>
      <button class="btn btn-icon btn-text btn-sm" @click="handleDelete" :disabled="deleting" aria-label="Delete task">
        &#128465;
      </button>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  transition: box-shadow var(--md-transition);
  cursor: default;
}

.task-card:hover {
  box-shadow: var(--md-shadow);
}

.task-completed {
  opacity: 0.65;
}

.task-completed .task-title {
  text-decoration: line-through;
}

.check-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--md-outline);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--md-on-primary);
  transition: all var(--md-transition);
  flex-shrink: 0;
  margin-top: 2px;
}

.check-btn.checked {
  background: var(--md-primary);
  border-color: var(--md-primary);
}

.task-card-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.task-title {
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-word;
}

.task-desc {
  margin-bottom: 8px;
  word-break: break-word;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
