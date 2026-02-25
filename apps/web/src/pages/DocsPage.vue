<script setup lang="ts">
// Ovo — Documentation Page
// SPDX-License-Identifier: GPL-3.0

import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { marked } from "marked";

// Import markdown files as raw strings
import readmeMd from "../../../../docs/README.md?raw";
import gettingStartedMd from "../../../../docs/getting-started.md?raw";
import architectureMd from "../../../../docs/architecture.md?raw";
import apiReferenceMd from "../../../../docs/api-reference.md?raw";
import mobileAppMd from "../../../../docs/mobile-app.md?raw";
import deploymentMd from "../../../../docs/deployment.md?raw";
import sharedPackageMd from "../../../../docs/shared-package.md?raw";

interface DocSection {
  id: string;
  title: string;
  content: string;
}

const sections: DocSection[] = [
  { id: "overview", title: "Overview", content: readmeMd },
  { id: "getting-started", title: "Getting Started", content: gettingStartedMd },
  { id: "architecture", title: "Architecture", content: architectureMd },
  { id: "api-reference", title: "API Reference", content: apiReferenceMd },
  { id: "mobile-app", title: "Mobile App", content: mobileAppMd },
  { id: "deployment", title: "Deployment", content: deploymentMd },
  { id: "shared-package", title: "Shared Package", content: sharedPackageMd },
];

const activeSection = ref("overview");
const sidebarOpen = ref(false);

const renderedContent = computed(() => {
  const section = sections.find((s) => s.id === activeSection.value);
  if (!section) return "";
  return marked.parse(section.content, { async: false }) as string;
});

function setSection(id: string) {
  activeSection.value = id;
  sidebarOpen.value = false;
  nextTick(() => {
    const content = document.querySelector(".docs-content");
    if (content) content.scrollTop = 0;
  });
}

// Handle hash-based navigation
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  if (hash && sections.some((s) => s.id === hash)) {
    activeSection.value = hash;
  }
}

onMounted(() => {
  handleHashChange();
  window.addEventListener("hashchange", handleHashChange);
});

onUnmounted(() => {
  window.removeEventListener("hashchange", handleHashChange);
});
</script>

<template>
  <div class="docs-layout">
    <!-- ─── Top Bar ────────────────────────────────────── -->
    <header class="docs-topbar">
      <div class="docs-topbar-inner">
        <button class="docs-hamburger" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle sidebar">
          <span :class="{ open: sidebarOpen }"></span>
        </button>
        <router-link to="/docs" class="docs-brand">
          <span class="brand-name">Ovo</span>
          <span class="brand-divider">|</span>
          <span class="brand-label">Docs</span>
        </router-link>
        <nav class="docs-topbar-nav">
          <router-link to="/" class="topbar-link">App</router-link>
          <a href="https://github.com/NotoriousArnav/Ovo" target="_blank" rel="noopener" class="topbar-link">GitHub</a>
          <a href="https://ovo-backend.vercel.app/api/docs" target="_blank" rel="noopener" class="topbar-link">Swagger</a>
        </nav>
      </div>
    </header>

    <div class="docs-body">
      <!-- ─── Sidebar ──────────────────────────────────── -->
      <aside class="docs-sidebar" :class="{ open: sidebarOpen }">
        <nav class="docs-nav">
          <button
            v-for="section in sections"
            :key="section.id"
            class="docs-nav-item"
            :class="{ active: activeSection === section.id }"
            @click="setSection(section.id)"
          >
            {{ section.title }}
          </button>
        </nav>
        <div class="docs-sidebar-footer">
          <a href="https://github.com/NotoriousArnav/Ovo/releases" target="_blank" rel="noopener" class="docs-sidebar-link">
            Download APK
          </a>
          <a href="https://ovo-backend.vercel.app/api/health" target="_blank" rel="noopener" class="docs-sidebar-link">
            API Health
          </a>
        </div>
      </aside>

      <!-- ─── Backdrop (mobile) ────────────────────────── -->
      <div v-if="sidebarOpen" class="docs-backdrop" @click="sidebarOpen = false"></div>

      <!-- ─── Content ──────────────────────────────────── -->
      <main class="docs-content">
        <article class="docs-article" v-html="renderedContent"></article>
      </main>
    </div>
  </div>
</template>

<style scoped>
.docs-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--md-surface);
}

/* ─── Top Bar ──────────────────────────────────────────── */
.docs-topbar {
  position: sticky;
  top: 0;
  z-index: 200;
  background: var(--md-surface-container);
  border-bottom: 1px solid var(--md-outline-variant);
}

.docs-topbar-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.docs-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--md-primary);
  letter-spacing: -0.5px;
}

.brand-divider {
  color: var(--md-outline);
  font-weight: 300;
}

.brand-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--md-on-surface-variant);
}

.docs-topbar-nav {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.topbar-link {
  padding: 6px 14px;
  border-radius: var(--md-radius-xl);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-decoration: none;
  transition: all var(--md-transition);
}

.topbar-link:hover {
  background: var(--md-surface-container-high);
  text-decoration: none;
  color: var(--md-on-surface);
}

/* ─── Hamburger (mobile) ───────────────────────────────── */
.docs-hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  width: 40px;
  height: 40px;
  position: relative;
  flex-shrink: 0;
}

.docs-hamburger span,
.docs-hamburger span::before,
.docs-hamburger span::after {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--md-on-surface);
  position: absolute;
  left: 10px;
  transition: all var(--md-transition);
}

.docs-hamburger span { top: 19px; }
.docs-hamburger span::before { content: ""; top: -6px; }
.docs-hamburger span::after { content: ""; top: 6px; }
.docs-hamburger span.open { background: transparent; }
.docs-hamburger span.open::before { top: 0; transform: rotate(45deg); }
.docs-hamburger span.open::after { top: 0; transform: rotate(-45deg); }

/* ─── Body ─────────────────────────────────────────────── */
.docs-body {
  display: flex;
  flex: 1;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

/* ─── Sidebar ──────────────────────────────────────────── */
.docs-sidebar {
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 16px 12px;
  border-right: 1px solid var(--md-outline-variant);
  display: flex;
  flex-direction: column;
}

.docs-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.docs-nav-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: var(--md-radius-xl);
  background: none;
  color: var(--md-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all var(--md-transition);
  font-family: inherit;
}

.docs-nav-item:hover {
  background: var(--md-surface-container-high);
  color: var(--md-on-surface);
}

.docs-nav-item.active {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  font-weight: 600;
}

.docs-sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--md-outline-variant);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.docs-sidebar-link {
  padding: 8px 16px;
  border-radius: var(--md-radius-sm);
  font-size: 0.8125rem;
  color: var(--md-on-surface-variant);
  text-decoration: none;
  transition: all var(--md-transition);
}

.docs-sidebar-link:hover {
  background: var(--md-surface-container-high);
  color: var(--md-primary);
  text-decoration: none;
}

/* ─── Backdrop (mobile overlay) ────────────────────────── */
.docs-backdrop {
  display: none;
}

/* ─── Content ──────────────────────────────────────────── */
.docs-content {
  flex: 1;
  min-width: 0;
  padding: 32px 40px;
  overflow-y: auto;
}

.docs-article {
  max-width: 800px;
}

/* ─── Markdown Styles (inside .docs-article) ───────────── */
.docs-article :deep(h1) {
  font-size: 2rem;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0 0 16px;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.docs-article :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 40px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--md-outline-variant);
  letter-spacing: -0.3px;
  line-height: 1.3;
}

.docs-article :deep(h3) {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 28px 0 8px;
  line-height: 1.4;
}

.docs-article :deep(h4) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 20px 0 8px;
}

.docs-article :deep(p) {
  margin: 0 0 16px;
  line-height: 1.7;
  color: var(--md-on-surface);
}

.docs-article :deep(a) {
  color: var(--md-primary);
  text-decoration: none;
  font-weight: 500;
}

.docs-article :deep(a:hover) {
  text-decoration: underline;
}

.docs-article :deep(strong) {
  font-weight: 600;
  color: var(--md-on-surface);
}

.docs-article :deep(blockquote) {
  margin: 0 0 16px;
  padding: 12px 20px;
  border-left: 4px solid var(--md-primary);
  background: var(--md-surface-container-low);
  border-radius: 0 var(--md-radius-sm) var(--md-radius-sm) 0;
  color: var(--md-on-surface-variant);
}

.docs-article :deep(blockquote p) {
  margin: 0;
}

.docs-article :deep(ul),
.docs-article :deep(ol) {
  margin: 0 0 16px;
  padding-left: 24px;
}

.docs-article :deep(li) {
  margin-bottom: 6px;
  line-height: 1.6;
}

.docs-article :deep(li > ul),
.docs-article :deep(li > ol) {
  margin: 6px 0 0;
}

.docs-article :deep(hr) {
  border: none;
  border-top: 1px solid var(--md-outline-variant);
  margin: 32px 0;
}

/* ─── Code ─────────────────────────────────────────────── */
.docs-article :deep(code) {
  font-family: "JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 0.875em;
  background: var(--md-surface-container-highest);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--md-primary);
}

.docs-article :deep(pre) {
  margin: 0 0 16px;
  padding: 16px 20px;
  background: var(--md-surface-container-highest);
  border-radius: var(--md-radius-md);
  overflow-x: auto;
  border: 1px solid var(--md-outline-variant);
}

.docs-article :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--md-on-surface);
  line-height: 1.6;
}

/* ─── Tables ───────────────────────────────────────────── */
.docs-article :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 16px;
  font-size: 0.875rem;
  overflow-x: auto;
  display: block;
}

.docs-article :deep(thead) {
  background: var(--md-surface-container);
}

.docs-article :deep(th) {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: var(--md-on-surface);
  border-bottom: 2px solid var(--md-outline-variant);
  white-space: nowrap;
}

.docs-article :deep(td) {
  padding: 10px 14px;
  border-bottom: 1px solid var(--md-outline-variant);
  color: var(--md-on-surface);
  vertical-align: top;
}

.docs-article :deep(tr:hover td) {
  background: var(--md-surface-container-low);
}

/* ─── Images ───────────────────────────────────────────── */
.docs-article :deep(img) {
  max-width: 100%;
  border-radius: var(--md-radius-sm);
}

/* ─── Responsive ───────────────────────────────────────── */
@media (max-width: 900px) {
  .docs-hamburger {
    display: block;
  }

  .docs-topbar-nav {
    display: none;
  }

  .docs-sidebar {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    width: 280px;
    z-index: 150;
    background: var(--md-surface-container);
    transform: translateX(-100%);
    transition: transform var(--md-transition);
    border-right: 1px solid var(--md-outline-variant);
  }

  .docs-sidebar.open {
    transform: translateX(0);
  }

  .docs-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    top: 56px;
    z-index: 140;
    background: rgba(0, 0, 0, 0.4);
  }

  .docs-content {
    padding: 24px 16px;
  }
}

@media (max-width: 600px) {
  .docs-article :deep(table) {
    font-size: 0.75rem;
  }

  .docs-article :deep(th),
  .docs-article :deep(td) {
    padding: 8px 10px;
  }

  .docs-article :deep(pre) {
    padding: 12px 14px;
    font-size: 0.75rem;
  }
}
</style>
