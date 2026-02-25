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
  Card,
  ActivityIndicator,
} from "react-native-paper";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import type { Task, TaskStatus, DailySummary } from "@ovo/shared";
import { useTaskStore } from "../../stores/taskStore";
import { useAuthStore } from "../../stores/authStore";
import { aiService } from "../../services/ai";
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

  // ─── AI Daily Summary state ──────────────────────────
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryDismissed, setSummaryDismissed] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await aiService.fetchDailySummary();
      setSummary(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 503) {
        // AI not configured — silently hide
        setSummaryDismissed(true);
      } else if (status === 429) {
        setSummaryError("Rate limit reached. Try again later.");
      } else {
        setSummaryError("Couldn't generate summary.");
      }
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks(true);
      fetchStats();
      if (!summary && !summaryDismissed) {
        loadSummary();
      }
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

      {/* AI Daily Summary */}
      {!summaryDismissed && (
        <Animated.View entering={FadeInUp.springify().damping(15)}>
          {summaryLoading ? (
            <Card
              style={[styles.summaryCard, { borderColor: theme.colors.primary }]}
              mode="outlined"
            >
              <Card.Content style={styles.summaryLoadingContent}>
                <ActivityIndicator size="small" />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginLeft: 12 }}
                >
                  Generating your daily summary...
                </Text>
              </Card.Content>
            </Card>
          ) : summaryError ? (
            <Card
              style={[styles.summaryCard, { borderColor: theme.colors.error }]}
              mode="outlined"
            >
              <Card.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                  {summaryError}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button compact onPress={loadSummary}>
                  Retry
                </Button>
                <Button compact onPress={() => setSummaryDismissed(true)}>
                  Dismiss
                </Button>
              </Card.Actions>
            </Card>
          ) : summary ? (
            <Card
              style={[styles.summaryCard, { borderColor: theme.colors.primary }]}
              mode="outlined"
            >
              <Card.Content>
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryTitleRow}>
                    <Text
                      variant="titleMedium"
                      style={{ color: theme.colors.primary, fontWeight: "700" }}
                    >
                      Daily Focus
                    </Text>
                  </View>
                  <View style={styles.summaryActions}>
                    <IconButton
                      icon="refresh"
                      size={18}
                      onPress={loadSummary}
                      iconColor={theme.colors.onSurfaceVariant}
                    />
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => setSummaryDismissed(true)}
                      iconColor={theme.colors.onSurfaceVariant}
                    />
                  </View>
                </View>

                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, marginBottom: 12 }}
                >
                  {summary.summary}
                </Text>

                {summary.focusTasks.map((ft, i) => (
                  <View key={ft.id} style={styles.focusTaskRow}>
                    <View
                      style={[
                        styles.focusRank,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text
                        variant="labelSmall"
                        style={{ color: theme.colors.onPrimary, fontWeight: "700" }}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    <View style={styles.focusTaskContent}>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                      >
                        {ft.title}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {ft.reason}
                      </Text>
                    </View>
                  </View>
                ))}

                {summary.encouragement && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontStyle: "italic",
                      marginTop: 8,
                    }}
                  >
                    {summary.encouragement}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ) : null}
        </Animated.View>
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
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 16,
  },
  summaryLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  summaryActions: {
    flexDirection: "row",
    marginRight: -8,
  },
  focusTaskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 10,
  },
  focusRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  focusTaskContent: {
    flex: 1,
  },
});
