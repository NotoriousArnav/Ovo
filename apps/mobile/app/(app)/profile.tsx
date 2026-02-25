// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Appbar,
  List,
  Divider,
  Text,
  Button,
  useTheme,
  Avatar,
  TextInput,
  Card,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../stores/authStore";
import { useTaskStore } from "../../stores/taskStore";
import { apiKeyService } from "../../services/apiKeys";
import type { ApiKey } from "@ovo/shared";

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { reset: resetTasks } = useTaskStore();

  // ─── API Keys state ────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const keys = await apiKeyService.list();
      setApiKeys(keys);
    } catch {
      // silent — keys section just stays empty
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadKeys();
    }, [loadKeys])
  );

  const handleCreateKey = async () => {
    const name = newKeyName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await apiKeyService.create(name);
      setNewKeyRaw(created.key);
      setNewKeyName("");
      await loadKeys();
    } catch {
      Alert.alert("Error", "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = (key: ApiKey) => {
    Alert.alert("Revoke API Key", `Revoke "${key.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          try {
            await apiKeyService.revoke(key.id);
            setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
          } catch {
            Alert.alert("Error", "Failed to revoke API key");
          }
        },
      },
    ]);
  };

  const copyKey = async () => {
    if (!newKeyRaw) return;
    await Clipboard.setStringAsync(newKeyRaw);
    Alert.alert("Copied", "API key copied to clipboard");
  };

  const handleLogout = async () => {
    await logout();
    resetTasks();
    router.replace("/(auth)/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const formatRelative = (dateStr: string | null): string => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={{ backgroundColor: theme.colors.background }}
        statusBarHeight={insets.top}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Profile" />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.springify().damping(15)}>
          {/* Avatar & Name */}
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={initials}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              labelStyle={{ color: theme.colors.onPrimaryContainer }}
            />
            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onBackground, fontWeight: "700" }}
            >
              {user?.name}
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {user?.email}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Info */}
          <List.Section>
            <List.Subheader>Account</List.Subheader>
            <List.Item
              title="Member since"
              description={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"
              }
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />
          </List.Section>

          <Divider style={styles.divider} />

          {/* API Keys */}
          <List.Section>
            <List.Subheader>API Keys</List.Subheader>
            <Text
              variant="bodySmall"
              style={[styles.apiKeysHint, { color: theme.colors.onSurfaceVariant }]}
            >
              API keys let external tools like the Ovo MCP server access your account.
            </Text>

            {/* New key banner */}
            {newKeyRaw && (
              <Card
                style={[styles.newKeyCard, { backgroundColor: theme.colors.primaryContainer }]}
                mode="contained"
              >
                <Card.Content>
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.onPrimaryContainer, marginBottom: 4 }}
                  >
                    Your new API key
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onPrimaryContainer, marginBottom: 8 }}
                  >
                    Copy it now — you won't see it again.
                  </Text>
                  <View
                    style={[styles.keyDisplay, { backgroundColor: theme.colors.surface }]}
                  >
                    <Text
                      variant="bodySmall"
                      style={{ fontFamily: "monospace", color: theme.colors.onSurface }}
                      selectable
                      numberOfLines={2}
                    >
                      {newKeyRaw}
                    </Text>
                  </View>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={copyKey}>Copy</Button>
                  <Button onPress={() => setNewKeyRaw(null)}>Dismiss</Button>
                </Card.Actions>
              </Card>
            )}

            {/* Create form */}
            <View style={styles.createRow}>
              <TextInput
                mode="outlined"
                placeholder="Key name (e.g. MCP Server)"
                value={newKeyName}
                onChangeText={setNewKeyName}
                maxLength={50}
                style={styles.createInput}
                dense
                disabled={creating}
              />
              <Button
                mode="contained"
                onPress={handleCreateKey}
                disabled={creating || !newKeyName.trim()}
                loading={creating}
                compact
                style={styles.createButton}
              >
                Create
              </Button>
            </View>

            {/* Key list */}
            {keysLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : apiKeys.length === 0 ? (
              <Text
                variant="bodySmall"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
              >
                No API keys yet.
              </Text>
            ) : (
              apiKeys.map((key) => (
                <List.Item
                  key={key.id}
                  title={key.name}
                  description={`${key.keyPrefix}...  ·  Last used: ${formatRelative(key.lastUsedAt)}`}
                  left={(props) => <List.Icon {...props} icon="key-variant" />}
                  right={(props) => (
                    <IconButton
                      {...props}
                      icon="delete-outline"
                      iconColor={theme.colors.error}
                      onPress={() => handleRevoke(key)}
                    />
                  )}
                />
              ))
            )}
          </List.Section>

          <Divider style={styles.divider} />

          <List.Section>
            <List.Subheader>About</List.Subheader>
            <List.Item
              title="Version"
              description="0.1.0"
              left={(props) => <List.Icon {...props} icon="information-outline" />}
            />
            <List.Item
              title="License"
              description="GPL-3.0"
              left={(props) => <List.Icon {...props} icon="license" />}
            />
          </List.Section>

          {/* Logout */}
          <View style={styles.logoutSection}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              icon="logout"
              textColor={theme.colors.error}
              style={[styles.logoutButton, { borderColor: theme.colors.error, borderRadius: 28 }]}
              contentStyle={styles.logoutContent}
            >
              Sign Out
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  divider: {
    marginVertical: 8,
  },
  apiKeysHint: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  newKeyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  keyDisplay: {
    padding: 10,
    borderRadius: 8,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  createInput: {
    flex: 1,
  },
  createButton: {
    marginTop: 6,
  },
  loader: {
    padding: 16,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutSection: {
    marginTop: 16,
    padding: 16,
  },
  logoutButton: {
    borderWidth: 1,
  },
  logoutContent: {
    paddingVertical: 8,
  },
});
