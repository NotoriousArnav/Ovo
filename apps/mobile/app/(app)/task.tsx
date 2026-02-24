// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Appbar,
  TextInput,
  Button,
  useTheme,
  HelperText,
  SegmentedButtons,
  Text,
  Snackbar,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { createTaskSchema, updateTaskSchema } from "@ovo/shared";
import type { TaskStatus, TaskPriority } from "@ovo/shared";
import { useTaskStore } from "../../stores/taskStore";
import { taskService } from "../../services/tasks";

export default function TaskScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const { createTask, updateTask } = useTaskStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && params.id) {
      loadTask(params.id);
    }
  }, [params.id]);

  const loadTask = async (id: string) => {
    setIsLoadingTask(true);
    try {
      const task = await taskService.getTask(id);
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
    } catch {
      setError("Failed to load task");
    }
    setIsLoadingTask(false);
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setError(null);

    const data = { title, description, status, priority };
    const schema = isEditing ? updateTaskSchema : createTaskSchema;
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const key = e.path[0]?.toString() || "form";
        errors[key] = e.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && params.id) {
        await updateTask(params.id, result.data);
      } else {
        await createTask(result.data as any);
      }
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save task");
    }
    setIsSubmitting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={{ backgroundColor: theme.colors.background }}
        statusBarHeight={insets.top}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isEditing ? "Edit Task" : "New Task"} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.form}>
            {/* Title */}
            <View>
              <TextInput
                mode="outlined"
                label="Task Title"
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                error={!!fieldErrors.title}
                style={styles.input}
                outlineStyle={{ borderRadius: 16 }}
              />
              {fieldErrors.title && (
                <HelperText type="error">{fieldErrors.title}</HelperText>
              )}
            </View>

            {/* Description */}
            <View>
              <TextInput
                mode="outlined"
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Add details..."
                multiline
                numberOfLines={4}
                error={!!fieldErrors.description}
                style={[styles.input, styles.descriptionInput]}
                outlineStyle={{ borderRadius: 16 }}
              />
              {fieldErrors.description && (
                <HelperText type="error">{fieldErrors.description}</HelperText>
              )}
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
              >
                Status
              </Text>
              <SegmentedButtons
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
                buttons={[
                  {
                    value: "pending",
                    label: "Pending",
                    icon: "clock-outline",
                  },
                  {
                    value: "in_progress",
                    label: "Active",
                    icon: "progress-clock",
                  },
                  {
                    value: "completed",
                    label: "Done",
                    icon: "check-circle-outline",
                  },
                ]}
                style={styles.segmented}
              />
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
              >
                Priority
              </Text>
              <SegmentedButtons
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
                buttons={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
                style={styles.segmented}
              />
            </View>

            {/* Submit */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || isLoadingTask}
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              {isEditing ? "Update Task" : "Create Task"}
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{ label: "Dismiss", onPress: () => setError(null) }}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 20,
  },
  form: {
    gap: 20,
  },
  section: {
    gap: 4,
  },
  input: {
    backgroundColor: "transparent",
  },
  descriptionInput: {
    minHeight: 120,
  },
  segmented: {
    borderRadius: 20,
  },
  button: {
    borderRadius: 28,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
