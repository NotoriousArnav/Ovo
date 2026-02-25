// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { useNotifications } from "../../hooks/useNotifications";

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();

  // Initialize notification scheduling on app open (after auth)
  useNotifications();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
