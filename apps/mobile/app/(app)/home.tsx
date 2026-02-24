// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  FAB,
  Searchbar,
  Text,
  IconButton,
  useTheme,
  Portal,
  Dialog,
  Button,
} from "react-native-paper";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Task, TaskStatus } from "@ovo/shared";
import { useTaskStore } from "../../stores/taskStore";
import { useAuthStore } from "../../stores/authStore";
import { TaskCard } from "../../components/TaskCard";
import { ProgressCard } from "../../components/ProgressCard";
import { StatusFilter } from "../../components/StatusFilter";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    tasks,
    stats,
    isLoading,
    isRefreshing,
    statusFilter,
    searchQuery,
    fetchTasks,
    fetchStats,
    setStatusFilter,
    setSearchQuery,
    updateTask,
    deleteTask,
    loadMore,
    refresh,
  } = useTaskStore();

  const [deleteDialog, setDeleteDialog] = useState<Task | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTasks(true);
      fetchStats();
    }, [])
  );

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
    } catch {
      // Error handled in store
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteTask(deleteDialog.id);
    } catch {
      // Error handled in store
    }
    setDeleteDialog(null);
  };

  const handleTaskPress = (task: Task) => {
    router.push({ pathname: "/(app)/task", params: { id: task.id } });
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  const renderHeader = () => (
    <View>
      {/* App Bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Hello, {firstName}
          </Text>
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.onBackground, fontWeight: "700" }}
          >
            My Tasks
          </Text>
        </View>
        <View style={styles.appBarActions}>
          <IconButton
            icon={searchVisible ? "close" : "magnify"}
            onPress={() => {
              setSearchVisible(!searchVisible);
              if (searchVisible) setSearchQuery("");
            }}
          />
          <IconButton
            icon="account-circle-outline"
            onPress={() => router.push("/(app)/profile")}
          />
        </View>
      </View>

      {/* Search */}
      {searchVisible && (
        <Searchbar
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { borderRadius: 28 }]}
          inputStyle={{ paddingLeft: 0 }}
        />
      )}

      {/* Progress */}
      {stats && stats.total > 0 && <ProgressCard stats={stats} />}

      {/* Filters */}
      <StatusFilter selected={statusFilter} onSelect={setStatusFilter} />
    </View>
  );

  if (isLoading && tasks.length === 0) {
    return <LoadingScreen message="Loading tasks..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <TaskCard
            task={item}
            index={index}
            onPress={handleTaskPress}
            onStatusChange={handleStatusChange}
            onDelete={setDeleteDialog}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No tasks yet"
            description="Tap the + button to create your first task"
            actionLabel="Create Task"
            onAction={() => router.push("/(app)/task")}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.emptyList,
        ]}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        onPress={() => router.push("/(app)/task")}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primaryContainer,
            bottom: insets.bottom + 16,
            borderRadius: 28,
          },
        ]}
        color={theme.colors.onPrimaryContainer}
        size="medium"
      />

      {/* Delete Confirmation */}
      <Portal>
        <Dialog
          visible={!!deleteDialog}
          onDismiss={() => setDeleteDialog(null)}
          style={{ borderRadius: 28 }}
        >
          <Dialog.Title>Delete task?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              "{deleteDialog?.title}" will be permanently deleted. This action
              cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              onPress={handleDelete}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  appBarActions: {
    flexDirection: "row",
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 0,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    right: 16,
    elevation: 4,
  },
});
