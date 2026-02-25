// Ovo — Smart Task Manager
// API Key service for mobile
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, ApiKey, ApiKeyCreated } from "@ovo/shared";

export const apiKeyService = {
  async list(): Promise<ApiKey[]> {
    const { data } = await api.get<ApiResponse<ApiKey[]>>("/keys");
    return data.data;
  },

  async create(name: string): Promise<ApiKeyCreated> {
    const { data } = await api.post<ApiResponse<ApiKeyCreated>>("/keys", { name });
    return data.data;
  },

  async revoke(id: string): Promise<void> {
    await api.delete(`/keys/${id}`);
  },
};
