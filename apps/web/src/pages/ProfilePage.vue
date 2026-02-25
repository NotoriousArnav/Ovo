<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTaskStore } from "@/stores/tasks";
import { fetchApiKeys, createApiKey, revokeApiKey } from "@/services/apiKeys";
import type { ApiKey } from "@ovo/shared";

const auth = useAuthStore();
const taskStore = useTaskStore();

// ─── API Keys state ──────────────────────────────────
const apiKeys = ref<ApiKey[]>([]);
const newKeyName = ref("");
const newKeyRaw = ref<string | null>(null);
const keysLoading = ref(false);
const keysError = ref<string | null>(null);
const creating = ref(false);
const copySuccess = ref(false);

async function loadKeys() {
  keysLoading.value = true;
  keysError.value = null;
  try {
    apiKeys.value = await fetchApiKeys();
  } catch {
    keysError.value = "Failed to load API keys";
  } finally {
    keysLoading.value = false;
  }
}

async function handleCreateKey() {
  if (!newKeyName.value.trim()) return;
  creating.value = true;
  keysError.value = null;
  try {
    const created = await createApiKey(newKeyName.value.trim());
    newKeyRaw.value = created.key;
    newKeyName.value = "";
    await loadKeys();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    keysError.value = msg || "Failed to create API key";
  } finally {
    creating.value = false;
  }
}

async function handleRevoke(id: string) {
  keysError.value = null;
  try {
    await revokeApiKey(id);
    apiKeys.value = apiKeys.value.filter((k) => k.id !== id);
    if (newKeyRaw.value) newKeyRaw.value = null;
  } catch {
    keysError.value = "Failed to revoke API key";
  }
}

function copyKey() {
  if (!newKeyRaw.value) return;
  navigator.clipboard.writeText(newKeyRaw.value);
  copySuccess.value = true;
  setTimeout(() => (copySuccess.value = false), 2000);
}

function dismissKey() {
  newKeyRaw.value = null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

onMounted(() => {
  auth.loadProfile();
  taskStore.loadStats();
  loadKeys();
});
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

    <!-- API Keys Section -->
    <div class="api-keys-section mt-6">
      <h3 class="mb-4">API Keys</h3>
      <p class="text-muted text-sm mb-4">
        API keys let you connect external tools like the Ovo MCP server to your account.
        Keys never expire — revoke them when you no longer need them.
      </p>

      <!-- New key banner (shown once after creation) -->
      <div v-if="newKeyRaw" class="new-key-banner card card-filled mb-4">
        <div class="new-key-header">
          <strong>Your new API key</strong>
          <span class="text-sm text-muted">Copy it now — you won't see it again.</span>
        </div>
        <div class="new-key-value">
          <code>{{ newKeyRaw }}</code>
        </div>
        <div class="new-key-actions">
          <button class="btn btn-sm btn-filled" @click="copyKey">
            {{ copySuccess ? "Copied!" : "Copy" }}
          </button>
          <button class="btn btn-sm btn-outlined" @click="dismissKey">Dismiss</button>
        </div>
      </div>

      <!-- Create form -->
      <form class="create-key-form mb-4" @submit.prevent="handleCreateKey">
        <input
          v-model="newKeyName"
          type="text"
          class="input"
          placeholder="Key name (e.g. MCP Server)"
          maxlength="50"
          :disabled="creating"
        />
        <button class="btn btn-filled" type="submit" :disabled="creating || !newKeyName.trim()">
          {{ creating ? "Creating..." : "Create Key" }}
        </button>
      </form>

      <p v-if="keysError" class="text-error text-sm mb-4">{{ keysError }}</p>

      <!-- Key list -->
      <div v-if="keysLoading" class="text-muted text-sm">Loading keys...</div>
      <div v-else-if="apiKeys.length === 0" class="text-muted text-sm">No API keys yet.</div>
      <div v-else class="key-list">
        <div v-for="key in apiKeys" :key="key.id" class="key-item card card-outlined">
          <div class="key-info">
            <span class="key-name">{{ key.name }}</span>
            <code class="key-prefix text-muted text-xs">{{ key.keyPrefix }}...</code>
          </div>
          <div class="key-meta text-muted text-xs">
            <span>Created {{ formatDate(key.createdAt) }}</span>
            <span>Last used: {{ formatRelative(key.lastUsedAt) }}</span>
          </div>
          <button class="btn btn-sm btn-error-outlined" @click="handleRevoke(key.id)">Revoke</button>
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

/* ─── API Keys ──────────────────────────────────────── */
.new-key-banner {
  padding: 16px;
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  border-radius: 12px;
}

.new-key-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.new-key-value {
  background: var(--md-surface);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.new-key-value code {
  font-size: 0.8rem;
  word-break: break-all;
  color: var(--md-on-surface);
}

.new-key-actions {
  display: flex;
  gap: 8px;
}

.create-key-form {
  display: flex;
  gap: 8px;
}

.create-key-form .input {
  flex: 1;
}

.key-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.key-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.key-name {
  font-weight: 500;
}

.key-prefix {
  font-family: monospace;
}

.key-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
  flex-shrink: 0;
}

.btn-error-outlined {
  color: var(--md-error);
  border: 1px solid var(--md-error);
  background: transparent;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-error-outlined:hover {
  background: color-mix(in srgb, var(--md-error) 10%, transparent);
}

.text-error {
  color: var(--md-error);
}
</style>
