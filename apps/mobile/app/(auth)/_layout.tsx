// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
      }}
    />
  );
}
