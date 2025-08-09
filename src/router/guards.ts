// src/router/guards.ts
import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function installGuards (router: Router) {
  router.beforeEach(async (to) => {
    const userStore = useUserStore()

    if (userStore.loading) {
      await userStore.fetchUserOnAuthChange()
    }

    const isAuthed   = !!userStore.user
    const needsAuth  = to.matched.some(r => r.meta?.requiresAuth)
    const needsGuest = to.matched.some(r => r.meta?.requiresGuest)

    if (needsAuth && !isAuthed) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (needsGuest && isAuthed) {
      return { path: '/' }
    }

    return true
  })
}
