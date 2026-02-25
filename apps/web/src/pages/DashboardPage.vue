<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTaskStore } from "@/stores/tasks";
import { fetchDailySummary } from "@/services/ai";
import type { DailySummary } from "@ovo/shared";
import TaskCard from "@/components/TaskCard.vue";
import StatsBar from "@/components/StatsBar.vue";
import TaskFilters from "@/components/TaskFilters.vue";

const router = useRouter();
const taskStore = useTaskStore();
const searchInput = ref("");
let searchTimeout: ReturnType<typeof setTimeout>;

// ─── Daily Summary state ─────────────────────────────
const summary = ref<DailySummary | null>(null);
const summaryLoading = ref(false);
const summaryError = ref<string | null>(null);
const summaryDismissed = ref(false);

async function loadSummary() {
  summaryLoading.value = true;
  summaryError.value = null;
  try {
    summary.value = await fetchDailySummary();
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 503) {
      // AI not configured — silently hide
      summaryError.value = null;
      summaryDismissed.value = true;
    } else if (status === 429) {
      summaryError.value = "Rate limit reached — try again later";
    } else {
      summaryError.value = "Couldn't load AI summary";
    }
  } finally {
    summaryLoading.value = false;
  }
}

onMounted(() => {
  taskStore.loadTasks(1);
  taskStore.loadStats();
  loadSummary();
});

function handleSearch(value: string) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    taskStore.setFilter("search", value || undefined);
  }, 300);
}

function goToPage(page: number) {
  taskStore.loadTasks(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <div class="dashboard">
    <!-- ─── AI Daily Summary ─────────────────────────── -->
    <div v-if="summaryLoading && !summaryDismissed" class="summary-card card card-outlined summary-loading">
      <div class="spinner"></div>
      <span class="text-muted text-sm">Generating your daily focus...</span>
    </div>

    <div v-else-if="summary && !summaryDismissed" class="summary-card card card-outlined">
      <div class="summary-header">
        <div class="summary-title">
          <span class="summary-icon">&#9889;</span>
          <strong>Daily Focus</strong>
        </div>
        <div class="summary-actions">
          <button class="btn btn-sm btn-secondary" @click="loadSummary" :disabled="summaryLoading" title="Refresh summary">
            &#8635;
          </button>
          <button class="btn btn-sm btn-text" @click="summaryDismissed = true" title="Dismiss">
            &#10005;
          </button>
        </div>
      </div>
      <p class="summary-text">{{ summary.summary }}</p>
      <div class="focus-tasks">
        <div v-for="(ft, idx) in summary.focusTasks" :key="ft.id" class="focus-task">
          <span class="focus-rank">{{ idx + 1 }}</span>
          <div class="focus-info">
            <span class="focus-title">{{ ft.title }}</span>
            <span class="focus-reason text-muted text-xs">{{ ft.reason }}</span>
          </div>
        </div>
      </div>
      <p class="summary-encouragement text-muted text-sm">{{ summary.encouragement }}</p>
    </div>

    <div v-else-if="summaryError && !summaryDismissed" class="summary-card card card-outlined summary-error">
      <span class="text-muted text-sm">{{ summaryError }}</span>
      <button class="btn btn-sm btn-secondary" @click="loadSummary">Retry</button>
    </div>

    <!-- ─── Stats ──────────────────────────────────── -->
    <StatsBar v-if="taskStore.stats" :stats="taskStore.stats" />

    <!-- ─── Header ─────────────────────────────────── -->
    <div class="dashboard-header">
      <h2>Tasks</h2>
      <button class="btn btn-primary" @click="router.push('/dashboard/tasks/new')">
        + New Task
      </button>
    </div>

    <!-- ─── Search + Filters ───────────────────────── -->
    <div class="filter-bar">
      <input
        v-model="searchInput"
        @input="handleSearch(searchInput)"
        type="search"
        class="form-input search-input"
        placeholder="Search tasks..."
      />
      <TaskFilters />
    </div>

    <!-- ─── Task List ──────────────────────────────── -->
    <div v-if="taskStore.loading && taskStore.tasks.length === 0" class="loading-state">
      <div class="spinner spinner-lg"></div>
    </div>

    <div v-else-if="taskStore.error" class="empty-state">
      <p class="text-error">{{ taskStore.error }}</p>
      <button class="btn btn-secondary btn-sm mt-4" @click="taskStore.loadTasks(1)">Retry</button>
    </div>

    <div v-else-if="taskStore.tasks.length === 0" class="empty-state">
      <p class="text-muted">No tasks found</p>
      <button class="btn btn-primary btn-sm mt-4" @click="router.push('/dashboard/tasks/new')">Create your first task</button>
    </div>

    <div v-else class="task-list">
      <TaskCard
        v-for="task in taskStore.tasks"
        :key="task.id"
        :task="task"
      />
    </div>

    <!-- ─── Pagination ─────────────────────────────── -->
    <div v-if="taskStore.pagination.totalPages > 1" class="pagination">
      <button
        class="btn btn-secondary btn-sm"
        :disabled="taskStore.pagination.page <= 1"
        @click="goToPage(taskStore.pagination.page - 1)"
      >
        Previous
      </button>
      <span class="text-sm text-muted">
        Page {{ taskStore.pagination.page }} of {{ taskStore.pagination.totalPages }}
      </span>
      <button
        class="btn btn-secondary btn-sm"
        :disabled="taskStore.pagination.page >= taskStore.pagination.totalPages"
        @click="goToPage(taskStore.pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.search-input {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}

/* ─── Daily Summary ──────────────────────────────── */
.summary-card {
  padding: 20px;
  border-left: 4px solid var(--md-primary);
}

.summary-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.summary-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
}

.summary-icon {
  font-size: 1.2rem;
}

.summary-actions {
  display: flex;
  gap: 4px;
}

.summary-text {
  margin-bottom: 16px;
  line-height: 1.5;
}

.focus-tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.focus-task {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--md-surface-container-low);
  border-radius: var(--md-radius-sm);
}

.focus-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--md-primary);
  color: var(--md-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.focus-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.focus-title {
  font-weight: 500;
}

.summary-encouragement {
  font-style: italic;
}
</style>
