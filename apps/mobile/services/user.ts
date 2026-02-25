// Ovo — User API service
// SPDX-License-Identifier: GPL-3.0

import api from "./api";
import type { ApiResponse, NotificationSettings } from "@ovo/shared";

export const userService = {
  async getNotificationTime(): Promise<NotificationSettings> {
    const { data } = await api.get<ApiResponse<NotificationSettings>>("/user/notification-time");
    return data.data;
  },

  async updateNotificationTime(settings: NotificationSettings): Promise<NotificationSettings> {
    const { data } = await api.put<ApiResponse<NotificationSettings>>("/user/notification-time", settings);
    return data.data;
  },
};
