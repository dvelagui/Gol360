<template>
  <div class="column justify-between full-height q-pa-lg">
    <q-list v-if="loaded" padding>
      <q-item>
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            {{ initials }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ displayName || 'Usuario' }}</q-item-label>
          <q-item-label caption>{{ roleLabel }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator spaced />

      <!-- Links por rol -->
      <q-item
        v-for="link in visibleLinks"
        :key="link.id"
        clickable
        v-ripple
        @click="go(link.url)"
      >
        <q-item-section avatar>
          <q-icon :name="link.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ link.title }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Logout -->
    <div class="q-pa-md q-mt-auto">
      <q-btn
        outline
        color="primary"
        icon="logout"
        label="Cerrar sesión"
        class="full-width"
        @click="logOut"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { db } from 'boot/firebase'
import { doc, getDoc } from 'firebase/firestore'

type Role = 'admin' | 'organizer' | 'captain' | 'player'

interface NavLink {
  id: string
  icon: string
  title: string
  url: string
}

const router = useRouter()
const userStore = useUserStore()

const loaded = ref(false)
const role = ref<Role>('player')
const displayName = computed(() => userStore.user?.displayName || userStore.user?.email || '')
const initials = computed(() => {
  const name = displayName.value || ''
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] || ''
  const last = parts[1]?.[0] || ''
  return (first + last).toUpperCase() || 'U'
})

const rolePermissions: Record<Role, string[]> = {
  admin:     ['home', 'dashboard', 'teams', 'matches', 'videos', 'analytics', 'calendar', 'profile'],
  organizer: ['home', 'dashboard', 'teams', 'matches', 'videos', 'calendar', 'profile'],
  captain:   ['home', 'team', 'matches', 'videos', 'profile'],
  player:    ['home', 'matches', 'videos', 'profile'],
}

const allLinks: NavLink[] = [
  { id: 'home',      icon: 'home',            title: 'Inicio',           url: '/' },
  { id: 'dashboard', icon: 'dashboard',       title: 'Panel',            url: '/dashboard' },
  { id: 'teams',     icon: 'groups',          title: 'Equipos',          url: '/teams' },
  { id: 'team',      icon: 'group',           title: 'Mi Equipo',        url: '/team' },
  { id: 'matches',   icon: 'sports_soccer',   title: 'Partidos',         url: '/matches' },
  { id: 'videos',    icon: 'video_library',   title: 'Videos',           url: '/videos' },
  { id: 'analytics', icon: 'analytics',       title: 'Analítica',        url: '/analytics' },
  { id: 'calendar',  icon: 'calendar_month',  title: 'Calendario',       url: '/calendar' },
  { id: 'profile',   icon: 'account_circle',  title: 'Perfil',           url: '/profile' },
]

const visibleLinks = computed<NavLink[]>(() => {
  const allowed = rolePermissions[role.value] ?? []
  return allLinks.filter(l => allowed.includes(l.id))
})

const roleLabel = computed(() => {
  switch (role.value) {
    case 'admin': return 'Administrador'
    case 'organizer': return 'Organizador'
    case 'captain': return 'Capitán'
    default: return 'Jugador'
  }
})

async function fetchUserRole () {
  const uid = userStore.user?.uid
  if (!uid) return
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    const r = (snap.data()?.role as Role) || 'player'
    role.value = r
  } catch {
    role.value = 'player'
  }
}

function go (path: string) {
  router.push(path)
}

async function logOut () {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (e) {
    console.error('Logout failed:', e)
  }
}

onMounted(async () => {
  await fetchUserRole()
  loaded.value = true
})
</script>

<style scoped lang="scss">
.q-item__label, .q-btn {
  font-weight: 600;
  letter-spacing: -0.01em;
}
.q-icon {
  font-size: 20px;
}
</style>
