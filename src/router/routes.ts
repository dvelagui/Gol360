import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '',
        name: 'dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: { requiresAuth: true }
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
        meta: { requiresGuest: true }
      }
    ],
  },

  // Siempre al final
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
