import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'
import { roleHome } from '@/utils/roles'

export function installGuards (router: Router) {
  router.beforeEach(async (to) => {
    const userStore = useUserStore()
    const database  = useDatabaseStore()

    if (userStore.loading) {
      await userStore.fetchUserOnAuthChange()
    }

    const isAuthed    = !!userStore.user
    const needsAuth   = to.matched.some(r => r.meta?.requiresAuth)
    const needsGuest  = to.matched.some(r => r.meta?.requiresGuest)
    const requiredRole = to.matched.find(r => r.meta?.requiresRole)?.meta?.requiresRole as string | undefined


    if (needsAuth && !isAuthed) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (requiredRole) {
      const role = database.userData?.role
      if (!role || role !== requiredRole) {
        return { path: roleHome(role) }
      }
    }

    if (needsGuest && isAuthed) {
      const role = database.userData?.role
      return { path: roleHome(role) }
    }

    if (to.path === '/' && isAuthed) {
      const role = database.userData?.role
      return { path: roleHome(role) }
    }

    return true
  })
}
