// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Appbar,
  List,
  Divider,
  Text,
  Button,
  useTheme,
  Avatar,
} from "react-native-paper";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuthStore } from "../../stores/authStore";
import { useTaskStore } from "../../stores/taskStore";

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { reset: resetTasks } = useTaskStore();

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={{ backgroundColor: theme.colors.background }}
        statusBarHeight={insets.top}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Profile" />
      </Appbar.Header>

      <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.content}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  divider: {
    marginVertical: 8,
  },
  logoutSection: {
    marginTop: "auto",
    padding: 16,
  },
  logoutButton: {
    borderWidth: 1,
  },
  logoutContent: {
    paddingVertical: 8,
  },
});
