// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();

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
