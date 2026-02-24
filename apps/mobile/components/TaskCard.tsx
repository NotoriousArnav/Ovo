// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Chip, useTheme, IconButton } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Task, TaskStatus, TaskPriority } from "@ovo/shared";

interface TaskCardProps {
  task: Task;
  index: number;
  onPress: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: string; color: string }
> = {
  pending: { label: "Pending", icon: "clock-outline", color: "#FF9800" },
  in_progress: { label: "In Progress", icon: "progress-clock", color: "#2196F3" },
  completed: { label: "Done", icon: "check-circle-outline", color: "#4CAF50" },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "#8BC34A" },
  medium: { label: "Medium", color: "#FF9800" },
  high: { label: "High", color: "#F44336" },
};

const AnimatedCard = Animated.createAnimatedComponent(Card);

export function TaskCard({
  task,
  index,
  onPress,
  onStatusChange,
  onDelete,
}: TaskCardProps) {
  const theme = useTheme();
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    pending: "in_progress",
    in_progress: "completed",
    completed: "pending",
  };

  const isCompleted = task.status === "completed";

  return (
    <AnimatedCard
      entering={FadeInDown.delay(index * 50).springify().damping(15)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 24,
          opacity: isCompleted ? 0.7 : 1,
        },
      ]}
      elevation={1}
    >
      <Pressable onPress={() => onPress(task)}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text
                variant="titleMedium"
                numberOfLines={1}
                style={[
                  styles.title,
                  isCompleted && styles.completedTitle,
                  { color: theme.colors.onSurface },
                ]}
              >
                {task.title}
              </Text>
              <IconButton
                icon="delete-outline"
                iconColor={theme.colors.error}
                size={20}
                onPress={() => onDelete(task)}
              />
            </View>
            {task.description ? (
              <Text
                variant="bodyMedium"
                numberOfLines={2}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {task.description}
              </Text>
            ) : null}
          </View>

          <View style={styles.chips}>
            <Chip
              icon={status.icon}
              compact
              style={[
                styles.chip,
                { backgroundColor: status.color + "20" },
              ]}
              textStyle={[styles.chipText, { color: status.color }]}
              onPress={() => onStatusChange(task, nextStatus[task.status])}
            >
              {status.label}
            </Chip>
            <Chip
              compact
              style={[
                styles.chip,
                { backgroundColor: priority.color + "20" },
              ]}
              textStyle={[styles.chipText, { color: priority.color }]}
            >
              {priority.label}
            </Chip>
            {task.dueDate && (
              <Chip
                icon="calendar"
                compact
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
                textStyle={[
                  styles.chipText,
                  { color: theme.colors.onSecondaryContainer },
                ]}
              >
                {new Date(task.dueDate).toLocaleDateString()}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Pressable>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  content: {
    gap: 12,
    paddingVertical: 16,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontWeight: "600",
  },
  completedTitle: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
