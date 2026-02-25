// Ovo — AI API service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, DailySummary } from "@ovo/shared";

export const aiService = {
  async fetchDailySummary(): Promise<DailySummary> {
    const { data } = await api.get<ApiResponse<DailySummary>>("/ai/daily-summary");
    return data.data;
  },
};
