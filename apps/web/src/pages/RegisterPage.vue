<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { registerSchema } from "@ovo/shared";
import type { ZodError } from "zod";

const router = useRouter();
const auth = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");
const fieldErrors = ref<Record<string, string>>({});

const API_URL = import.meta.env.VITE_API_URL || "https://ovo-backend.vercel.app";
const ehCallbackUrl = `${window.location.origin}/auth/eventhorizon/callback`;
const ehLoginUrl = computed(() =>
  `${API_URL}/api/auth/eventhorizon/login?redirect_uri=${encodeURIComponent(ehCallbackUrl)}`
);

async function handleSubmit() {
  fieldErrors.value = {};
  auth.clearError();

  try {
    const data = registerSchema.parse({
      name: name.value,
      email: email.value,
      password: password.value,
    });
    await auth.register(data);
    router.push("/dashboard");
  } catch (err: unknown) {
    if ((err as { errors?: unknown[] }).errors) {
      const zodErr = err as ZodError;
      zodErr.errors.forEach((e) => {
        const key = e.path[0]?.toString();
        if (key) fieldErrors.value[key] = e.message;
      });
    }
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card card card-elevated">
      <h1 class="auth-title">Create account</h1>
      <p class="text-muted text-sm mb-4">Get started with Ovo</p>

      <div v-if="auth.error" class="alert alert-error mb-4">{{ auth.error }}</div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="form-input"
            :class="{ error: fieldErrors.name }"
            placeholder="Your name"
            autocomplete="name"
          />
          <span v-if="fieldErrors.name" class="form-error">{{ fieldErrors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            :class="{ error: fieldErrors.email }"
            placeholder="you@example.com"
            autocomplete="email"
          />
          <span v-if="fieldErrors.email" class="form-error">{{ fieldErrors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            :class="{ error: fieldErrors.password }"
            placeholder="Min 8 chars, mixed case + digit"
            autocomplete="new-password"
          />
          <span v-if="fieldErrors.password" class="form-error">{{ fieldErrors.password }}</span>
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner" style="width:18px;height:18px;border-width:2px;"></span>
          {{ auth.loading ? "Creating..." : "Create account" }}
        </button>
      </form>

      <div class="auth-divider">
        <span class="auth-divider-text text-muted text-sm">or</span>
      </div>

      <a :href="ehLoginUrl" class="btn btn-outlined w-full eh-btn">
        Sign in with Event Horizon
      </a>

      <p class="auth-footer text-sm text-muted text-center mt-4">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
        <span class="auth-sep">·</span>
        <RouterLink to="/docs">Docs</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--md-surface);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-error {
  padding: 12px 16px;
  border-radius: var(--md-radius-sm);
  background: var(--md-error-container);
  color: var(--md-on-error-container);
  font-size: 0.875rem;
}

.auth-sep {
  margin: 0 4px;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--md-outline-variant);
}

.eh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}
</style>
