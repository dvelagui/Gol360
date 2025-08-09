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
      { path: '/auth/reset-password', component: () => import('@/pages/auth/ResetPassword.vue') },
      {
        path: '/auth/reset-password/confirm',
        component: () => import('@/pages/auth/ResetPasswordConfirm.vue'),
      },
    ],
  },

  // Siempre al final
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
