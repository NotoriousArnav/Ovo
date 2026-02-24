// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
