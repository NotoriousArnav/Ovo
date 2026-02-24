// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export const config = {
  apiUrl: API_URL,
  apiPrefix: `${API_URL}/api`,
} as const;
