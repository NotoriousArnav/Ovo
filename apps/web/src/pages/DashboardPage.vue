<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTaskStore } from "@/stores/tasks";
import TaskCard from "@/components/TaskCard.vue";
import StatsBar from "@/components/StatsBar.vue";
import TaskFilters from "@/components/TaskFilters.vue";

const router = useRouter();
const taskStore = useTaskStore();
const searchInput = ref("");
let searchTimeout: ReturnType<typeof setTimeout>;

onMounted(() => {
  taskStore.loadTasks(1);
  taskStore.loadStats();
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
    <!-- ─── Stats ──────────────────────────────────── -->
    <StatsBar v-if="taskStore.stats" :stats="taskStore.stats" />

    <!-- ─── Header ─────────────────────────────────── -->
    <div class="dashboard-header">
      <h2>Tasks</h2>
      <button class="btn btn-primary" @click="router.push('/tasks/new')">
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
      <button class="btn btn-primary btn-sm mt-4" @click="router.push('/tasks/new')">Create your first task</button>
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
</style>
