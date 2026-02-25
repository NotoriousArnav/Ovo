<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTaskStore } from "@/stores/tasks";
import { createTaskSchema, updateTaskSchema } from "@ovo/shared";
import type { TaskStatus, TaskPriority } from "@ovo/shared";
import { fetchTask } from "@/services/tasks";
import type { ZodError } from "zod";

const props = defineProps<{ id?: string }>();

const router = useRouter();
const route = useRoute();
const taskStore = useTaskStore();

const isEdit = computed(() => !!props.id || !!route.params.id);
const taskId = computed(() => props.id || (route.params.id as string));

const title = ref("");
const description = ref("");
const status = ref<TaskStatus>("pending");
const priority = ref<TaskPriority>("medium");
const dueDate = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

onMounted(async () => {
  if (isEdit.value && taskId.value) {
    loading.value = true;
    try {
      const task = await fetchTask(taskId.value);
      title.value = task.title;
      description.value = task.description;
      status.value = task.status;
      priority.value = task.priority;
      dueDate.value = task.dueDate ? task.dueDate.slice(0, 16) : "";
    } catch {
      error.value = "Failed to load task";
    } finally {
      loading.value = false;
    }
  }
});

async function handleSubmit() {
  fieldErrors.value = {};
  error.value = null;

  const payload = {
    title: title.value,
    description: description.value,
    status: status.value,
    priority: priority.value,
    dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : null,
  };

  try {
    if (isEdit.value) {
      updateTaskSchema.parse(payload);
      await taskStore.editTask(taskId.value, payload);
    } else {
      createTaskSchema.parse(payload);
      await taskStore.addTask(payload);
    }
    router.push("/dashboard");
  } catch (err: unknown) {
    if ((err as { errors?: unknown[] }).errors) {
      const zodErr = err as ZodError;
      zodErr.errors.forEach((e) => {
        const key = e.path[0]?.toString();
        if (key) fieldErrors.value[key] = e.message;
      });
      return;
    }
    if (typeof err === "object" && err !== null && "response" in err) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      error.value = resp?.data?.message || "Failed to save task";
    } else if (err instanceof Error) {
      error.value = err.message;
    }
  }
}
</script>

<template>
  <div class="task-form-page">
    <div class="task-form-header">
      <button class="btn btn-text" @click="router.back()">&#8592; Back</button>
      <h2>{{ isEdit ? "Edit Task" : "New Task" }}</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner spinner-lg"></div>
    </div>

    <form v-else class="task-form card card-outlined" @submit.prevent="handleSubmit">
      <div v-if="error" class="alert alert-error mb-4">{{ error }}</div>

      <div class="form-group">
        <label class="form-label" for="title">Title *</label>
        <input
          id="title"
          v-model="title"
          type="text"
          class="form-input"
          :class="{ error: fieldErrors.title }"
          placeholder="What needs to be done?"
          maxlength="200"
        />
        <span v-if="fieldErrors.title" class="form-error">{{ fieldErrors.title }}</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="description">Description</label>
        <textarea
          id="description"
          v-model="description"
          class="form-textarea"
          :class="{ error: fieldErrors.description }"
          placeholder="Add details..."
          maxlength="2000"
          rows="4"
        ></textarea>
        <span v-if="fieldErrors.description" class="form-error">{{ fieldErrors.description }}</span>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="status">Status</label>
          <select id="status" v-model="status" class="form-select">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="priority">Priority</label>
          <select id="priority" v-model="priority" class="form-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="dueDate">Due Date</label>
        <input
          id="dueDate"
          v-model="dueDate"
          type="datetime-local"
          class="form-input"
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="router.back()">Cancel</button>
        <button type="submit" class="btn btn-primary">
          {{ isEdit ? "Save Changes" : "Create Task" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.task-form-page {
  max-width: 640px;
  margin: 0 auto;
}

.task-form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.alert-error {
  padding: 12px 16px;
  border-radius: var(--md-radius-sm);
  background: var(--md-error-container);
  color: var(--md-on-error-container);
  font-size: 0.875rem;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
