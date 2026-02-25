// Ovo — Vue Router
// SPDX-License-Identifier: GPL-3.0

import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { getAccessToken } from "@/services/api";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/pages/LoginPage.vue"),
    meta: { guest: true },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("@/pages/RegisterPage.vue"),
    meta: { guest: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: { auth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: () => import("@/pages/DashboardPage.vue"),
      },
      {
        path: "tasks/new",
        name: "task-new",
        component: () => import("@/pages/TaskFormPage.vue"),
      },
      {
        path: "tasks/:id/edit",
        name: "task-edit",
        component: () => import("@/pages/TaskFormPage.vue"),
        props: true,
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/pages/ProfilePage.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ─── Navigation guards ──────────────────────────────
router.beforeEach((to) => {
  const token = getAccessToken();

  if (to.meta.auth && !token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guest && token) {
    return { name: "dashboard" };
  }
});

export default router;
