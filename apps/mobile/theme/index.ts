// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
} from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

// ─── M3 Expressive Customizations ─────────────────────
// Android 16 Material You Expressive: bolder radii, more saturated colors
// We apply these on top of dynamic colors when available

const expressiveRoundness = {
  // M3 Expressive uses larger corner radii
  roundness: 28,
};

// Fallback seed color when dynamic theming is unavailable (iOS, older Android)
export const SEED_COLOR = "#6750A4"; // Material purple

// Font configuration — use system defaults for a native feel
const fontConfig = {
  displayLarge: { fontFamily: "System", fontWeight: "400" as const },
  displayMedium: { fontFamily: "System", fontWeight: "400" as const },
  displaySmall: { fontFamily: "System", fontWeight: "400" as const },
  headlineLarge: { fontFamily: "System", fontWeight: "400" as const },
  headlineMedium: { fontFamily: "System", fontWeight: "400" as const },
  headlineSmall: { fontFamily: "System", fontWeight: "400" as const },
  titleLarge: { fontFamily: "System", fontWeight: "500" as const },
  titleMedium: { fontFamily: "System", fontWeight: "500" as const },
  titleSmall: { fontFamily: "System", fontWeight: "500" as const },
  bodyLarge: { fontFamily: "System", fontWeight: "400" as const },
  bodyMedium: { fontFamily: "System", fontWeight: "400" as const },
  bodySmall: { fontFamily: "System", fontWeight: "400" as const },
  labelLarge: { fontFamily: "System", fontWeight: "500" as const },
  labelMedium: { fontFamily: "System", fontWeight: "500" as const },
  labelSmall: { fontFamily: "System", fontWeight: "500" as const },
};

export function createAppTheme(
  dynamicColors?: { light: Record<string, string>; dark: Record<string, string> },
  isDark: boolean = false
): MD3Theme {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    ...expressiveRoundness,
    colors: dynamicColors
      ? { ...baseTheme.colors, ...(isDark ? dynamicColors.dark : dynamicColors.light) }
      : baseTheme.colors,
    fonts: configureFonts({ config: fontConfig }),
  };
}

export const lightTheme = createAppTheme(undefined, false);
export const darkTheme = createAppTheme(undefined, true);
