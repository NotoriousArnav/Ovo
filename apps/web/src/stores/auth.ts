// Ovo — Auth store (Pinia)
// SPDX-License-Identifier: GPL-3.0

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@ovo/shared";
import type { LoginInput, RegisterInput } from "@ovo/shared";
import { loginApi, registerApi, logoutApi } from "@/services/auth";
import { fetchProfile } from "@/services/user";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!getAccessToken());

  async function login(data: LoginInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await loginApi(data);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      user.value = result.user;
    } catch (err: unknown) {
      const msg = extractError(err);
      error.value = msg;
      throw new Error(msg);
    } finally {
      loading.value = false;
    }
  }

  async function register(data: RegisterInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await registerApi(data);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      user.value = result.user;
    } catch (err: unknown) {
      const msg = extractError(err);
      error.value = msg;
      throw new Error(msg);
    } finally {
      loading.value = false;
    }
  }

  async function loadProfile() {
    if (!getAccessToken()) return;
    try {
      user.value = await fetchProfile();
    } catch {
      // Token may be invalid
      logout();
    }
  }

  async function logout() {
    try {
      await logoutApi(getRefreshToken());
    } catch {
      // Ignore logout errors
    }
    user.value = null;
    clearTokens();
  }

  function clearError() {
    error.value = null;
  }

  return { user, loading, error, isAuthenticated, login, register, loadProfile, logout, clearError };
});

function extractError(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}
