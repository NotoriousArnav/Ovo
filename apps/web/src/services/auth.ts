// Ovo — Auth API service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, LoginResponse } from "@ovo/shared";
import type { LoginInput, RegisterInput } from "@ovo/shared";

export async function loginApi(data: LoginInput): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
  return res.data.data;
}

export async function registerApi(data: RegisterInput): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/register", data);
  return res.data.data;
}

export async function refreshTokenApi(refreshToken: string) {
  const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>("/auth/refresh", { refreshToken });
  return res.data.data;
}

export async function logoutApi(refreshToken: string | null) {
  await api.post("/auth/logout", { refreshToken });
}
