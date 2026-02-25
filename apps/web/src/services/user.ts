// Ovo — User API service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, User } from "@ovo/shared";

export async function fetchProfile(): Promise<User> {
  const res = await api.get<ApiResponse<User>>("/user/profile");
  return res.data.data;
}
