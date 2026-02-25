<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTaskStore } from "@/stores/tasks";

const auth = useAuthStore();
const taskStore = useTaskStore();

onMounted(() => {
  auth.loadProfile();
  taskStore.loadStats();
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<template>
  <div class="profile-page">
    <h2 class="mb-4">Profile</h2>

    <div v-if="auth.user" class="profile-card card card-outlined">
      <div class="profile-avatar">
        {{ auth.user.name.charAt(0).toUpperCase() }}
      </div>
      <div class="profile-info">
        <h3>{{ auth.user.name }}</h3>
        <p class="text-muted text-sm">{{ auth.user.email }}</p>
        <p class="text-muted text-xs mt-2">Member since {{ formatDate(auth.user.createdAt) }}</p>
      </div>
    </div>

    <div v-if="taskStore.stats" class="stats-section mt-6">
      <h3 class="mb-4">Your Statistics</h3>
      <div class="stats-grid">
        <div class="stat-card card card-outlined">
          <span class="stat-value">{{ taskStore.stats.total }}</span>
          <span class="stat-label text-muted text-sm">Total Tasks</span>
        </div>
        <div class="stat-card card card-outlined">
          <span class="stat-value">{{ taskStore.stats.completed }}</span>
          <span class="stat-label text-muted text-sm">Completed</span>
        </div>
        <div class="stat-card card card-outlined">
          <span class="stat-value">{{ taskStore.stats.inProgress }}</span>
          <span class="stat-label text-muted text-sm">In Progress</span>
        </div>
        <div class="stat-card card card-outlined">
          <span class="stat-value">{{ taskStore.stats.completionRate }}%</span>
          <span class="stat-label text-muted text-sm">Completion Rate</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 640px;
  margin: 0 auto;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 4px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--md-primary);
}
</style>
