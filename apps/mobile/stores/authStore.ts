// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User, LoginInput, RegisterInput } from "@ovo/shared";
import { authService } from "../services/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (accessToken) {
        const user = await authService.getProfile();
        set({ user, isAuthenticated: true, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      // Token invalid/expired — clear and start fresh
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      set({ isInitialized: true, isAuthenticated: false, user: null });
    }
  },

  login: async (input: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(input);
      await SecureStore.setItemAsync("accessToken", result.tokens.accessToken);
      await SecureStore.setItemAsync("refreshToken", result.tokens.refreshToken);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  register: async (input: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(input);
      await SecureStore.setItemAsync("accessToken", result.tokens.accessToken);
      await SecureStore.setItemAsync("refreshToken", result.tokens.refreshToken);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Registration failed. Please try again.";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (refreshToken) {
        await authService.logout(refreshToken).catch(() => {});
      }
    } finally {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
