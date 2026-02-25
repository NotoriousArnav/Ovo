// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import type { User, LoginInput, RegisterInput } from "@ovo/shared";
import { authService } from "../services/auth";
import { config } from "../constants/config";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  eventHorizonLogin: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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

  eventHorizonLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUri = "ovo://auth/callback";
      const loginUrl = `${config.apiPrefix}/auth/eventhorizon/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
          await SecureStore.setItemAsync("accessToken", accessToken);
          await SecureStore.setItemAsync("refreshToken", refreshToken);

          // Fetch user profile with the new token
          const user = await authService.getProfile();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      // User cancelled or no tokens received
      set({ isLoading: false, error: result.type === "cancel" ? null : "Authentication failed. Please try again." });
    } catch (error: any) {
      const message = error.message || "Event Horizon login failed. Please try again.";
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
