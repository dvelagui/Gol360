import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/register',
        name: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: '/auth/reset-password',
        name: 'reset-password',
        component: () => import('@/pages/auth/ResetPassword.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: '/auth/reset-password/confirm',
        name: 'reset-password-confirm',
        component: () => import('@/pages/auth/ResetPasswordConfirm.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: '/:catchAll(.*)*',
        name: 'not-found',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { requiresGuest: true },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('pages/dashboard/AdminDashboard.vue'),
        meta: { requiresAuth: true, requiresRole: 'admin' },
      },
    ],
  },
  {
    path: '/manager',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'manager-dashboard',
        component: () => import('pages/dashboard/ManagerDashboard.vue'),
        meta: { requiresAuth: true, requiresRole: 'manager' },
      },
    ],
  },

  {
    path: '/team',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'team-dashboard',
        component: () => import('pages/dashboard/TeamDashboard.vue'),
        meta: { requiresAuth: true, requiresRole: 'team' },
      },
    ],
  },

  {
    path: '/player',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'player-dashboard',
        component: () => import('pages/dashboard/PlayerDashboard.vue'),
        meta: { requiresAuth: true, requiresRole: 'player' },
      },
    ],
  },
];

export default routes;
