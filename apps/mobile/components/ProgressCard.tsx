// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import type { TaskStats } from "@ovo/shared";

interface ProgressCardProps {
  stats: TaskStats;
}

export function ProgressCard({ stats }: ProgressCardProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primaryContainer,
          borderRadius: 28,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onPrimaryContainer, fontWeight: "700" }}
        >
          Your Progress
        </Text>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onPrimaryContainer, fontWeight: "700" }}
        >
          {stats.completionRate}%
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.onPrimaryContainer + "20" },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${stats.completionRate}%`,
            },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <StatItem
          label="Pending"
          value={stats.pending}
          color="#FF9800"
          bgColor={theme.colors.onPrimaryContainer + "10"}
          textColor={theme.colors.onPrimaryContainer}
        />
        <StatItem
          label="Active"
          value={stats.inProgress}
          color="#2196F3"
          bgColor={theme.colors.onPrimaryContainer + "10"}
          textColor={theme.colors.onPrimaryContainer}
        />
        <StatItem
          label="Done"
          value={stats.completed}
          color="#4CAF50"
          bgColor={theme.colors.onPrimaryContainer + "10"}
          textColor={theme.colors.onPrimaryContainer}
        />
      </View>
    </Animated.View>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  textColor: string;
}

function StatItem({ label, value, color, bgColor, textColor }: StatItemProps) {
  return (
    <View style={[styles.statItem, { backgroundColor: bgColor, borderRadius: 20 }]}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text variant="titleLarge" style={{ color: textColor, fontWeight: "700" }}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: textColor, opacity: 0.7 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
