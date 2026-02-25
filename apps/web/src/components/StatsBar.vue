<script setup lang="ts">
import type { TaskStats } from "@ovo/shared";

defineProps<{ stats: TaskStats }>();
</script>

<template>
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-num">{{ stats.total }}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-item stat-pending">
      <span class="stat-num">{{ stats.pending }}</span>
      <span class="stat-label">Pending</span>
    </div>
    <div class="stat-item stat-progress">
      <span class="stat-num">{{ stats.inProgress }}</span>
      <span class="stat-label">In Progress</span>
    </div>
    <div class="stat-item stat-done">
      <span class="stat-num">{{ stats.completed }}</span>
      <span class="stat-label">Completed</span>
    </div>
    <div class="stat-item stat-rate">
      <span class="stat-num">{{ stats.completionRate }}%</span>
      <span class="stat-label">Done</span>
    </div>
  </div>
</template>

<style scoped>
.stats-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border-radius: var(--md-radius-md);
  background: var(--md-surface-container);
}

.stat-num {
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--md-on-surface-variant);
}

.stat-pending .stat-num { color: var(--md-warning); }
.stat-progress .stat-num { color: var(--md-primary); }
.stat-done .stat-num { color: var(--md-success); }
.stat-rate .stat-num { color: var(--md-tertiary); }
</style>
