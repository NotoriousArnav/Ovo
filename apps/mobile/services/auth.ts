// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type {
  LoginInput,
  RegisterInput,
  LoginResponse,
  RegisterResponse,
  ApiResponse,
  User,
} from "@ovo/shared";

export const authService = {
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const { data } = await api.post<ApiResponse<RegisterResponse>>(
      "/auth/register",
      input
    );
    return data.data;
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      input
    );
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken });
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>("/user/profile");
    return data.data;
  },
};
