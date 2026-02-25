<script setup lang="ts">
// Ovo — Event Horizon OAuth2 Callback
// SPDX-License-Identifier: GPL-3.0

import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { setTokens } from "@/services/api";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const error = ref<string | null>(null);

onMounted(async () => {
  // Try vue-router query first, fall back to raw URL search params
  const accessToken =
    (route.query.access_token as string) ||
    new URLSearchParams(window.location.search).get("access_token");
  const refreshToken =
    (route.query.refresh_token as string) ||
    new URLSearchParams(window.location.search).get("refresh_token");

  if (accessToken && refreshToken) {
    setTokens(accessToken, refreshToken);

    // Try to load profile, but don't fail the whole flow if it errors
    try {
      await auth.loadProfile();
    } catch (err) {
      console.warn("[EH Callback] profile load failed, continuing anyway:", err);
    }

    // Clean tokens from URL before navigating
    window.history.replaceState({}, "", window.location.pathname);
    router.replace("/dashboard");
  } else {
    error.value = "Authentication failed. No tokens received from Event Horizon.";
  }
});
</script>

<template>
  <div class="callback-page">
    <div class="callback-card card card-elevated">
      <template v-if="error">
        <h2 class="callback-title">Authentication Failed</h2>
        <p class="text-muted text-sm">{{ error }}</p>
        <router-link to="/login" class="btn btn-primary mt-4">Back to Login</router-link>
      </template>
      <template v-else>
        <div class="callback-loading">
          <span class="spinner"></span>
          <p class="text-muted text-sm mt-2">Signing you in...</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--md-surface);
}

.callback-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  text-align: center;
}

.callback-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.callback-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
