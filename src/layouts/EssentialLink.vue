<template>
 <div class="column justify-between  q-pa-lg">

    <div class="text-center q-mb-xl">
      <q-img
        src="@/assets/logo.png"
        fit="contain"
        style="max-width: 140px"
      />
    </div>

    <q-list v-if="loaded" padding>

      <div class="column items-center q-mt-xl">
        <q-avatar size="70px">
          <img v-if="avatar" :src="avatar" alt="avatar" />
          <span v-else class="text-h6">{{ initials }}</span>
        </q-avatar>

        <div class="text-h6 text-weight-bold q-mt-sm">
          {{ displayName }}
        </div>

        <div class="text-caption text-grey-7">
          {{ email }}
        </div>
      </div>

      <q-separator spaced />

      <q-item v-for="link in visibleLinks" :key="link.id" clickable v-ripple @click="go(link.url)">
        <q-item-section avatar>
          <q-icon :name="link.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ link.title }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="q-pa-md q-mt-auto text-center">
      <q-btn flat color="secondary" label="Cerrar Sesión" icon="logout" @click="logOut" />
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
const avatar = ref<string | null>(null)
const email = computed(() => userStore.user?.email || '')
const displayName = computed(() => userStore.user?.displayName || 'Usuario')
const initials = computed(() => {
  const name = displayName.value.trim()
  const parts = name.split(' ')
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
})

const rolePermissions: Record<Role, string[]> = {
  admin: ['home', 'dashboard', 'teams', 'matches', 'videos', 'analytics', 'calendar', 'profile'],
  organizer: ['home', 'dashboard', 'teams', 'matches', 'videos', 'calendar', 'profile'],
  captain: ['home', 'team', 'matches', 'videos', 'profile'],
  player: ['home', 'matches', 'videos', 'profile'],
}

const allLinks: NavLink[] = [
  { id: 'home', icon: 'home', title: 'Inicio', url: '/' },
  { id: 'dashboard', icon: 'dashboard', title: 'Panel', url: '/dashboard' },
  { id: 'teams', icon: 'groups', title: 'Equipos', url: '/teams' },
  { id: 'team', icon: 'group', title: 'Mi Equipo', url: '/team' },
  { id: 'matches', icon: 'sports_soccer', title: 'Partidos', url: '/matches' },
  { id: 'videos', icon: 'video_library', title: 'Videos', url: '/videos' },
  { id: 'analytics', icon: 'analytics', title: 'Analítica', url: '/analytics' },
  { id: 'calendar', icon: 'calendar_month', title: 'Calendario', url: '/calendar' },
  { id: 'profile', icon: 'account_circle', title: 'Perfil', url: '/profile' },
]

const visibleLinks = computed(() => {
  return allLinks.filter(l => rolePermissions[role.value]?.includes(l.id))
})

async function fetchUserData() {
  const uid = userStore.user?.uid
  if (!uid) return
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) {
    role.value = snap.data().role || 'player'
    avatar.value = snap.data().avatar || null
  }
}

function go(path: string) {
  router.push(path)
}

async function logOut() {
  await userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await fetchUserData()
  loaded.value = true
})
</script>

<style scoped lang="scss">
.q-item__label {
  font-weight: 600;
}

.q-icon {
  font-size: 20px;
}
</style>
