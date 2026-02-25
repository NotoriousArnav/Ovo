// Ovo — Notification scheduling hook
// SPDX-License-Identifier: GPL-3.0

import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { aiService } from "../services/ai";
import { userService } from "../services/user";

// ─── Constants ───────────────────────────────────────
const NOTIFICATION_TIME_KEY = "ovo_notification_time";
const NOTIFICATION_ENABLED_KEY = "ovo_notifications_enabled";
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;
const CHANNEL_ID = "daily-summary";

// ─── Configure handler (must run at module level) ────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Types ───────────────────────────────────────────
export interface NotificationTime {
  hour: number;
  minute: number;
}

// ─── Helpers ─────────────────────────────────────────

/** Read the user's preferred notification time from local storage. */
export async function getNotificationTime(): Promise<NotificationTime> {
  try {
    const raw = await SecureStore.getItemAsync(NOTIFICATION_TIME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { hour: parsed.hour ?? DEFAULT_HOUR, minute: parsed.minute ?? DEFAULT_MINUTE };
    }
  } catch {
    // Fallback to defaults
  }
  return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
}

/** Persist the user's preferred notification time. */
export async function setNotificationTime(time: NotificationTime): Promise<void> {
  await SecureStore.setItemAsync(NOTIFICATION_TIME_KEY, JSON.stringify(time));
}

/** Check whether notifications are enabled (user preference). */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(NOTIFICATION_ENABLED_KEY);
    return raw !== "false"; // default: enabled
  } catch {
    return true;
  }
}

/** Toggle notifications on/off. */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(NOTIFICATION_ENABLED_KEY, enabled ? "true" : "false");
}

/** Request notification permissions + set up Android channel. */
async function ensurePermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Daily Summary",
      description: "Your AI-powered daily task summary",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Cancel any existing daily summary notification and schedule a new one.
 * Fetches a fresh summary from the backend and uses it as the notification body.
 * Also syncs the notification time from the backend.
 */
async function scheduleDailySummary(): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  const hasPermission = await ensurePermissions();
  if (!hasPermission) return;

  // Cancel previous daily summary notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Sync notification time from backend (best-effort)
  let time: NotificationTime;
  try {
    const remote = await userService.getNotificationTime();
    time = { hour: remote.hour, minute: remote.minute };
    await setNotificationTime(time);
  } catch {
    time = await getNotificationTime();
  }

  // Fetch summary
  let title = "Your Daily Focus";
  let body = "Open Ovo to see your priorities for today.";

  try {
    const summary = await aiService.fetchDailySummary();
    if (summary.focusTasks.length > 0) {
      title = "Your Daily Focus";
      const taskList = summary.focusTasks
        .map((ft, i) => `${i + 1}. ${ft.title}`)
        .join("\n");
      body = `${summary.summary}\n\n${taskList}`;
    } else {
      body = summary.summary || body;
    }
  } catch {
    // If the API call fails (503 AI not configured, 429, network error, etc.)
    // just schedule a generic reminder instead
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: "daily-summary" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: CHANNEL_ID,
    },
  });
}

// ─── Hook ────────────────────────────────────────────

/**
 * Initializes notification infrastructure and schedules the daily summary.
 * Should be called once in the authenticated app layout.
 */
export function useNotifications() {
  const hasScheduled = useRef(false);

  const reschedule = useCallback(async () => {
    try {
      await scheduleDailySummary();
    } catch {
      // Best-effort — don't crash the app
    }
  }, []);

  useEffect(() => {
    if (hasScheduled.current) return;
    hasScheduled.current = true;
    reschedule();
  }, [reschedule]);

  return { reschedule };
}
