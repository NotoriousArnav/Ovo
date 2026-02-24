// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text
        variant="headlineSmall"
        style={[styles.title, { color: theme.colors.onSurfaceVariant }]}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
    borderRadius: 28,
  },
  buttonContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});
