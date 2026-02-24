// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../stores/authStore";
import { createAppTheme, SEED_COLOR } from "../theme";
import { LoadingScreen } from "../components/LoadingScreen";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { theme: m3Theme } = useMaterial3Theme({ fallbackSourceColor: SEED_COLOR });
  const { isInitialized, initialize } = useAuthStore();

  const paperTheme = createAppTheme(
    m3Theme ? { light: m3Theme.light as any, dark: m3Theme.dark as any } : undefined,
    isDark
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <PaperProvider theme={paperTheme}>
        <LoadingScreen message="Starting Ovo..." />
      </PaperProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
