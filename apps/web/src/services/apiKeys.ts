// Ovo — API Key service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, ApiKey, ApiKeyCreated } from "@ovo/shared";

export async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await api.get<ApiResponse<ApiKey[]>>("/keys");
  return res.data.data;
}

export async function createApiKey(name: string): Promise<ApiKeyCreated> {
  const res = await api.post<ApiResponse<ApiKeyCreated>>("/keys", { name });
  return res.data.data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await api.delete(`/keys/${id}`);
}
