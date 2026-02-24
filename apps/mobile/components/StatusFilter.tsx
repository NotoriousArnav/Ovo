// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Chip, useTheme } from "react-native-paper";
import type { TaskStatus } from "@ovo/shared";

interface StatusFilterProps {
  selected: TaskStatus | undefined;
  onSelect: (status: TaskStatus | undefined) => void;
}

const filters: Array<{ key: TaskStatus | undefined; label: string; icon: string }> = [
  { key: undefined, label: "All", icon: "format-list-bulleted" },
  { key: "pending", label: "Pending", icon: "clock-outline" },
  { key: "in_progress", label: "In Progress", icon: "progress-clock" },
  { key: "completed", label: "Completed", icon: "check-circle-outline" },
];

export function StatusFilter({ selected, onSelect }: StatusFilterProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isSelected = filter.key === selected;
        return (
          <Chip
            key={filter.label}
            icon={filter.icon}
            selected={isSelected}
            onPress={() => onSelect(filter.key)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? theme.colors.secondaryContainer
                  : theme.colors.surfaceVariant,
                borderRadius: 20,
              },
            ]}
            textStyle={{
              color: isSelected
                ? theme.colors.onSecondaryContainer
                : theme.colors.onSurfaceVariant,
            }}
          >
            {filter.label}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
  },
});
