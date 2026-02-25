<!-- Ovo — Landing Page
     SPDX-License-Identifier: GPL-3.0 -->

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { getAccessToken } from "@/services/api";
import { computed, onMounted } from "vue";

const isLoggedIn = computed(() => !!getAccessToken());

// Keep Android Open — resist Google's sideloading lockdown
onMounted(() => {
  if (!document.getElementById("kao-banner-script")) {
    const s = document.createElement("script");
    s.id = "kao-banner-script";
    s.src = "https://keepandroidopen.org/banner.js";
    s.async = true;
    document.head.appendChild(s);
  }
});
</script>

<template>
  <div class="landing">
    <!-- ─── Nav ─────────────────────────────────────── -->
    <header class="landing-nav">
      <div class="landing-nav-inner">
        <span class="landing-brand">Ovo</span>
        <nav class="landing-nav-links">
          <a href="https://brocode-tech.netlify.app/" target="_blank" rel="noopener" class="nav-link">BroCode</a>
          <RouterLink to="/docs" class="nav-link">Docs</RouterLink>
          <a href="https://github.com/NotoriousArnav/Ovo" target="_blank" rel="noopener" class="nav-link">GitHub</a>
          <template v-if="isLoggedIn">
            <RouterLink to="/dashboard" class="btn btn-primary btn-sm">Dashboard</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/login" class="nav-link">Sign In</RouterLink>
            <RouterLink to="/register" class="btn btn-primary btn-sm">Get Started</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <!-- ─── Hero ────────────────────────────────────── -->
    <section class="hero">
      <h1 class="hero-title">Ovo</h1>
      <p class="hero-tagline">A Simple Self-Hosted Task Management Application</p>
      <p class="hero-desc">
        Built for the <a href="https://brocode-tech.netlify.app/" target="_blank" rel="noopener">BroCode Tech</a> community.
        Organize your tasks across web and mobile with a clean Material&nbsp;You interface.
        Self-host on your own infrastructure — your data stays yours.
      </p>
      <div class="hero-actions">
        <template v-if="isLoggedIn">
          <RouterLink to="/dashboard" class="btn btn-primary">Go to Dashboard</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/register" class="btn btn-primary">Get Started</RouterLink>
          <RouterLink to="/login" class="btn btn-secondary">Sign In</RouterLink>
        </template>
        <RouterLink to="/docs" class="btn btn-text">View Docs</RouterLink>
      </div>
    </section>

    <!-- ─── Features ────────────────────────────────── -->
    <section class="features">
      <div class="feature-card card card-outlined">
        <div class="feature-icon">&#x1F3E0;</div>
        <h3>Self-Hosted</h3>
        <p>Deploy on your own server. Full control over your data, privacy, and configuration.</p>
      </div>
      <div class="feature-card card card-outlined">
        <div class="feature-icon">&#x1F4F1;</div>
        <h3>Cross-Platform</h3>
        <p>Web app for desktop, native Android APK for mobile. One backend, multiple clients.</p>
      </div>
      <div class="feature-card card card-outlined">
        <div class="feature-icon">&#x1F3A8;</div>
        <h3>Material You</h3>
        <p>Modern Material Design 3 theming with automatic dark mode and dynamic colors on Android.</p>
      </div>
      <div class="feature-card card card-outlined">
        <div class="feature-icon">&#x1F511;</div>
        <h3>Community SSO</h3>
        <p>Sign in with your BroCode Event Horizon account. No third-party OAuth — the community runs its own identity provider.</p>
      </div>
    </section>

    <!-- ─── Community ───────────────────────────────── -->
    <section class="community">
      <h2 class="community-title">Built for BroCode Tech</h2>
      <p class="community-desc">
        Ovo is made for and by the BroCode Tech community — an open community for developers,
        builders, and learners. Join us at events, contribute to projects, and grow together.
      </p>
      <div class="community-links">
        <a href="https://brocode-tech.netlify.app/" target="_blank" rel="noopener" class="btn btn-secondary">Community Website</a>
        <a href="https://events.neopanda.tech" target="_blank" rel="noopener" class="btn btn-secondary">Events</a>
      </div>
    </section>

    <!-- ─── Tech Strip ──────────────────────────────── -->
    <section class="tech-strip">
      <span class="tech-label">Built with</span>
      <div class="tech-tags">
        <span class="chip">Vue 3</span>
        <span class="chip">Expo</span>
        <span class="chip">Express.js</span>
        <span class="chip">Prisma</span>
        <span class="chip">PostgreSQL</span>
        <span class="chip">TypeScript</span>
      </div>
    </section>

    <!-- ─── Footer ──────────────────────────────────── -->
    <footer class="landing-footer">
      <p>
        <a href="https://brocode-tech.netlify.app/" target="_blank" rel="noopener">BroCode Tech</a>
        <span class="sep">&middot;</span>
        <a href="https://events.neopanda.tech" target="_blank" rel="noopener">Events</a>
        <span class="sep">&middot;</span>
        <a href="https://github.com/NotoriousArnav/Ovo" target="_blank" rel="noopener">GitHub</a>
        <span class="sep">&middot;</span>
        <RouterLink to="/docs">Documentation</RouterLink>
        <span class="sep">&middot;</span>
        <a href="https://ovo-backend.vercel.app/api/docs" target="_blank" rel="noopener">API Docs</a>
      </p>
      <p class="text-xs text-muted">GPL-3.0 &copy; {{ new Date().getFullYear() }} Ovo &mdash; A BroCode Tech Project</p>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--md-surface);
}

/* ─── Nav ──────────────────────────────────────────── */
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--md-surface-container);
  border-bottom: 1px solid var(--md-outline-variant);
}

.landing-nav-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landing-brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--md-primary);
  letter-spacing: -0.5px;
}

.landing-nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  padding: 6px 14px;
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

/* ─── Hero ─────────────────────────────────────────── */
.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px 48px;
  max-width: 720px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--md-primary);
  letter-spacing: -1.5px;
  line-height: 1.1;
}

.hero-tagline {
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--md-on-surface);
  margin-top: 12px;
}

.hero-desc {
  font-size: 1rem;
  color: var(--md-on-surface-variant);
  margin-top: 16px;
  max-width: 540px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ─── Features ─────────────────────────────────────── */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px 64px;
  width: 100%;
}

.feature-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.feature-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--md-on-surface);
}

.feature-card p {
  font-size: 0.875rem;
  color: var(--md-on-surface-variant);
  line-height: 1.5;
}

/* ─── Community ────────────────────────────────────── */
.community {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 64px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.community-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--md-on-surface);
}

.community-desc {
  font-size: 0.9375rem;
  color: var(--md-on-surface-variant);
  line-height: 1.6;
  max-width: 540px;
}

.community-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

/* ─── Tech strip ───────────────────────────────────── */
.tech-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 20px 64px;
}

.tech-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--md-on-surface-variant);
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

/* ─── Footer ───────────────────────────────────────── */
.landing-footer {
  text-align: center;
  padding: 24px 20px;
  border-top: 1px solid var(--md-outline-variant);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.landing-footer a {
  font-size: 0.875rem;
}

.sep {
  margin: 0 6px;
  color: var(--md-on-surface-variant);
}

/* ─── Responsive ───────────────────────────────────── */
@media (max-width: 600px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-tagline {
    font-size: 1.1rem;
  }

  .hero {
    padding: 48px 16px 32px;
  }

  .landing-nav-links .nav-link {
    display: none;
  }

  .landing-nav-links .btn {
    display: inline-flex;
  }
}
</style>
