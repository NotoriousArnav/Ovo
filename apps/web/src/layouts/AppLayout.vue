<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { onMounted, ref } from "vue";

const auth = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

onMounted(() => {
  auth.loadProfile();
});

async function handleLogout() {
  await auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="app-layout">
    <!-- ─── Top App Bar ───────────────────────────────── -->
    <header class="app-bar">
      <div class="app-bar-inner">
        <RouterLink to="/" class="app-title">Ovo</RouterLink>

        <nav class="nav-links">
          <RouterLink to="/" class="nav-link" active-class="nav-link--active">Dashboard</RouterLink>
          <RouterLink to="/tasks/new" class="nav-link" active-class="nav-link--active">New Task</RouterLink>
          <RouterLink to="/profile" class="nav-link" active-class="nav-link--active">Profile</RouterLink>
        </nav>

        <div class="app-bar-end">
          <span class="user-greeting" v-if="auth.user">{{ auth.user.name }}</span>
          <button class="btn btn-text btn-sm" @click="handleLogout">Logout</button>
        </div>

        <!-- Mobile hamburger -->
        <button class="hamburger" @click="menuOpen = !menuOpen" :aria-label="menuOpen ? 'Close menu' : 'Open menu'">
          <span :class="{ open: menuOpen }"></span>
        </button>
      </div>

      <!-- Mobile menu -->
      <nav class="mobile-nav" v-if="menuOpen" @click="menuOpen = false">
        <RouterLink to="/" class="mobile-link">Dashboard</RouterLink>
        <RouterLink to="/tasks/new" class="mobile-link">New Task</RouterLink>
        <RouterLink to="/profile" class="mobile-link">Profile</RouterLink>
        <button class="mobile-link logout" @click="handleLogout">Logout</button>
      </nav>
    </header>

    <!-- ─── Content ───────────────────────────────────── -->
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--md-surface-container);
  border-bottom: 1px solid var(--md-outline-variant);
}

.app-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--md-primary);
  text-decoration: none;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--md-radius-xl);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-decoration: none;
  transition: all var(--md-transition);
}

.nav-link:hover {
  background: var(--md-surface-container-high);
  text-decoration: none;
}

.nav-link--active {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}

.app-bar-end {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-greeting {
  font-size: 0.875rem;
  color: var(--md-on-surface-variant);
}

.app-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
}

/* ─── Hamburger (mobile only) ──────────────────────── */
.hamburger {
  display: none;
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  width: 40px;
  height: 40px;
  position: relative;
}

.hamburger span,
.hamburger span::before,
.hamburger span::after {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--md-on-surface);
  position: absolute;
  left: 8px;
  transition: all var(--md-transition);
}

.hamburger span { top: 19px; }
.hamburger span::before { content: ""; top: -7px; }
.hamburger span::after { content: ""; top: 7px; }

.hamburger span.open { background: transparent; }
.hamburger span.open::before { top: 0; transform: rotate(45deg); }
.hamburger span.open::after { top: 0; transform: rotate(-45deg); }

.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 8px 16px 16px;
  border-top: 1px solid var(--md-outline-variant);
}

.mobile-link {
  padding: 12px 16px;
  border-radius: var(--md-radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--md-on-surface);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.mobile-link:hover { background: var(--md-surface-container-high); }
.mobile-link.logout { color: var(--md-error); }

@media (max-width: 768px) {
  .nav-links,
  .app-bar-end { display: none; }
  .hamburger { display: block; }
  .mobile-nav { display: flex; }
}
</style>
