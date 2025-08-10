import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Auth (público / guest)
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'auth/reset-password',
        name: 'reset-password',
        component: () => import('@/pages/auth/ResetPassword.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'auth/reset-password/confirm',
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

// Admin
{
  path: '/admin',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: '',
      name: 'admin-dashboard',
      component: () => import('@/pages/dashboard/AdminDashboard.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: 'register',
      name: 'register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    // Torneos - solo admin
    {
      path: 'tournaments',
      name: 'tournaments-list',
      component: () => import('@/pages/tournaments/TournamentList.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: 'tournaments/:id',
      name: 'tournament-detail-admin',
      component: () => import('@/pages/tournaments/TournamentDetail.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
  ],
},

// Manager
{
  path: '/manager',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: '',
      name: 'manager-dashboard',
      component: () => import('@/pages/dashboard/ManagerDashboard.vue'),
      meta: { requiresAuth: true, requiresRole: 'manager' },
    },
    // Torneos - solo manager
    {
      path: 'tournaments',
      name: 'tournaments-list-manager',
      component: () => import('@/pages/tournaments/TournamentList.vue'),
      meta: { requiresAuth: true, requiresRole: 'manager' },
    },
    {
      path: 'tournaments/:id',
      name: 'tournament-detail-manager',
      component: () => import('@/pages/tournaments/TournamentDetail.vue'),
      meta: { requiresAuth: true, requiresRole: 'manager' },
    },
  ],
},

// Team
{
  path: '/team',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: '',
      name: 'team-dashboard',
      component: () => import('@/pages/dashboard/TeamDashboard.vue'),
      meta: { requiresAuth: true, requiresRole: 'team' },
    },
    {
      path: 'tournaments/:id',
      name: 'tournament-detail-team',
      component: () => import('@/pages/tournaments/TournamentDetail.vue'),
      meta: { requiresAuth: true, requiresRole: 'team' },
    },
  ],
},

// Player
{
  path: '/player',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: '',
      name: 'player-dashboard',
      component: () => import('@/pages/dashboard/PlayerDashboard.vue'),
      meta: { requiresAuth: true, requiresRole: 'player' },
    },
    {
      path: 'tournaments/:id',
      name: 'tournament-detail-player',
      component: () => import('@/pages/tournaments/TournamentDetail.vue'),
      meta: { requiresAuth: true, requiresRole: 'player' },
    },
  ],
},

];

export default routes;
