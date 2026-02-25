// Ovo — AI API service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, DailySummary } from "@ovo/shared";

export async function fetchDailySummary(): Promise<DailySummary> {
  const res = await api.get<ApiResponse<DailySummary>>("/ai/daily-summary");
  return res.data.data;
}
