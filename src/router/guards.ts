import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'
import { roleHome } from '@/utils/roles'

type Role = 'admin' | 'manager' | 'team' | 'player' | undefined

async function waitForRole(maxMs = 1500) {
  const database = useDatabaseStore()
  const userStore = useUserStore()

  const start = Date.now()
  while (
    userStore.user &&
    !database.userData?.role &&
    Date.now() - start < maxMs
  ) {
    await new Promise((r) => setTimeout(r, 50))
  }
}

export function installGuards(router: Router) {
  router.beforeEach(async (to) => {
    const userStore = useUserStore()
    const database = useDatabaseStore()

    // 1) Asegura estado de auth listo
    if (userStore.loading) {
      await userStore.fetchUserOnAuthChange()
    }

    const isAuthed = !!userStore.user
    const needsAuth = to.matched.some((r) => r.meta?.requiresAuth)
    const needsGuest = to.matched.some((r) => r.meta?.requiresGuest)

    // Permite definir uno u otro
    const requiredRole = to.matched.find((r) => r.meta?.requiresRole)?.meta
      ?.requiresRole as Role
    const allowedRoles = to.matched.find((r) => r.meta?.allowedRoles)?.meta
      ?.allowedRoles as Role[] | undefined

    // 2) Rutas privadas sin sesión -> login
    if (needsAuth && !isAuthed) {
      if (to.path !== '/login') {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
      return true
    }

    // 3) Si voy a usar rol (requiresRole/allowedRoles) o soy guest/root, espera el rol
    if (isAuthed && (requiredRole || allowedRoles || needsGuest || to.path === '/')) {
      await waitForRole()
    }
    const role = database.userData?.role || undefined
    const targetHome = roleHome(role)

    // 4) Validación por rol (array o único)
    if (requiredRole || (allowedRoles && allowedRoles.length)) {
      const isAllowed = requiredRole
        ? role === requiredRole
        : !!role && allowedRoles!.includes(role)

      if (!isAllowed) {
        // Redirige al home del rol actual si existe, si no, a /login o /
        if (isAuthed && role && to.path !== targetHome) {
          return { path: targetHome }
        }
        if (!isAuthed && to.path !== '/login') {
          return { path: '/login' }
        }
        // si no hay rol aún, envía a raíz (o a una pantalla de completar perfil si la tienes)
        if (isAuthed && !role && to.path !== '/') {
          return { path: '/' }
        }
      }
    }

    // 5) Guest: si ya está logueado, vete a su home
    if (needsGuest && isAuthed && role) {
      if (to.path !== targetHome) return { path: targetHome }
      return true
    }

    // 6) Raíz: si está logueado y ya hay rol, llévalo a su home
    if (to.path === '/' && isAuthed && role) {
      if (to.path !== targetHome) return { path: targetHome }
      return true
    }

    return true
  })
}
