import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'
import { roleHome } from '@/utils/roles'


// espera a que el rol esté disponible (máx 1.5s)
async function waitForRole(maxMs = 1500) {
  const database = useDatabaseStore()
  const userStore = useUserStore()

  const start = Date.now()
  while (userStore.user && !database.userData?.role && (Date.now() - start) < maxMs) {
    await new Promise(r => setTimeout(r, 50))
  }
}

export function installGuards (router: Router) {
  router.beforeEach(async (to) => {
    const userStore = useUserStore()
    const database  = useDatabaseStore()

    // 1) Asegura auth inicial lista
    if (userStore.loading) {
      await userStore.fetchUserOnAuthChange()
    }

    const isAuthed   = !!userStore.user
    const needsAuth  = to.matched.some(r => r.meta?.requiresAuth)
    const needsGuest = to.matched.some(r => r.meta?.requiresGuest)
    const requiredRole = to.matched.find(r => r.meta?.requiresRole)?.meta?.requiresRole as string | undefined

    // 2) Protege rutas privadas
    if (needsAuth && !isAuthed) {
      if (to.path !== '/login') {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
      return true
    }

    // 3) Si necesito rol, espera a que cargue (evita loop)
    if (isAuthed && (requiredRole || to.path === '/' || needsGuest)) {
      await waitForRole()
    }
    const role = database.userData?.role

    // 4) Si la ruta requiere un rol específico y no coincide → manda al home del rol actual (o raíz)
    if (requiredRole) {
      const target = roleHome(role)
      if (!role || role !== requiredRole) {
        // evita redirigir a la misma ruta
        if (to.path !== target) return { path: target }
        return true
      }
    }

    // 5) Usuario ya autenticado entrando a /login (requiresGuest) → envía a su home
    if (needsGuest && isAuthed) {
      const target = roleHome(role)
      if (to.path !== target) return { path: target }
      return true
    }

    // 6) Raíz “neutra”: si está logueado, llévalo a su home (solo si ya hay rol)
    if (to.path === '/' && isAuthed && role) {
      const target = roleHome(role)
      if (to.path !== target) return { path: target }
      return true
    }

    return true
  })
}
