// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Snackbar,
} from "react-native-paper";
import { Link, router } from "expo-router";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { registerSchema } from "@ovo/shared";
import { useAuthStore } from "../../stores/authStore";

export default function RegisterScreen() {
  const theme = useTheme();
  const { register, eventHorizonLogin, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleEventHorizonLogin = async () => {
    clearError();
    try {
      await eventHorizonLogin();
      if (useAuthStore.getState().isAuthenticated) {
        router.replace("/(app)/home");
      }
    } catch {
      // Error is set in the store
    }
  };

  const handleRegister = async () => {
    setFieldErrors({});
    clearError();

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const key = e.path[0]?.toString() || "form";
        errors[key] = e.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await register(result.data);
      router.replace("/(app)/home");
    } catch {
      // Error is set in the store
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.header}>
          <Text
            variant="displaySmall"
            style={[styles.appName, { color: theme.colors.primary }]}
          >
            Ovo
          </Text>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground }}
          >
            Create account
          </Text>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Start organizing your tasks today
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(15)}
          style={styles.form}
        >
          <View>
            <TextInput
              mode="outlined"
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              left={<TextInput.Icon icon="account-outline" />}
              error={!!fieldErrors.name}
              style={styles.input}
              outlineStyle={{ borderRadius: 16 }}
            />
            {fieldErrors.name && (
              <HelperText type="error">{fieldErrors.name}</HelperText>
            )}
          </View>

          <View>
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email-outline" />}
              error={!!fieldErrors.email}
              style={styles.input}
              outlineStyle={{ borderRadius: 16 }}
            />
            {fieldErrors.email && (
              <HelperText type="error">{fieldErrors.email}</HelperText>
            )}
          </View>

          <View>
            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!fieldErrors.password}
              style={styles.input}
              outlineStyle={{ borderRadius: 16 }}
            />
            {fieldErrors.password && (
              <HelperText type="error">{fieldErrors.password}</HelperText>
            )}
            <HelperText type="info">
              At least 8 characters with uppercase, lowercase, and a number
            </HelperText>
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>

          <Button
            mode="outlined"
            onPress={handleEventHorizonLogin}
            loading={isLoading}
            disabled={isLoading}
            icon="shield-account-outline"
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            Sign in with Event Horizon
          </Button>

          <View style={styles.linkRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.primary, fontWeight: "600" }}
              >
                Sign In
              </Text>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
        action={{ label: "Dismiss", onPress: clearError }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontWeight: "800",
    fontSize: 48,
    marginBottom: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "transparent",
  },
  button: {
    borderRadius: 28,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
});
