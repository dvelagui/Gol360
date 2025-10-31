<template>
  <div class="column justify-between  q-pa-lg">

    <div class="text-center q-mb-xl">
      <q-img src="@/assets/logo-w.png" fit="contain" style="max-width: 140px" />
    </div>

    <q-list v-if="loaded" padding>

      <q-separator spaced />
      <div class="column items-center q-my-lg avatar-container" @click="goToProfile">
        <q-avatar size="70px">
          <img v-if="avatar" :src="avatar" alt="avatar" />
          <span v-else class="text-h6">{{ initials }}</span>
          <div class="avatar-overlay">
            <q-icon name="edit" size="20px" class="q-mr-xs" />
            <span>Editar</span>
          </div>
        </q-avatar>

        <div class="text-h6 text-weight-bold q-mt-sm">
          {{ displayName }}
        </div>
        <div class="text-caption text-grey-7">
          {{ roleLabel }}
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
import { useDatabaseStore } from '@/stores/database'

type Role = 'admin' | 'manager' | 'team' | 'player'

interface NavLink {
  id: string
  icon: string
  title: string
  url: string
}

const router = useRouter()
const userStore = useUserStore()
const databaseStore = useDatabaseStore()

const loaded = ref(false)
const profile = ref(computed(() => databaseStore.userData))
const avatar = computed(() => (profile.value?.photoURL) || null)
const displayName = computed(() => (profile.value?.displayName) || 'Nombre de Usuario')
const role = computed<Role>(() => (profile.value?.role as Role) || '')
const roleLabel = computed(() => role.value === 'admin' ? 'Administrador'
  : role.value === 'manager' ? 'Organizador'
    : role.value === 'team' ? 'Capitán' : 'Jugador')
const initials = computed(() => {
  const name = displayName.value.trim()
  const parts = name.split(' ')
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
})

const rolePermissions: Record<Role, string[]> = {
  admin: ['dashboard', 'competition', 'schedule', 'stats', 'videos', 'calendar', 'store', 'profile', 'contact'],
  manager: ['dashboard', 'competition', 'schedule', 'stats', 'videos', 'calendar', 'store', 'profile', 'contact'],
  team: ['dashboard', 'competition', 'schedule', 'stats', 'videos', 'calendar', 'store', 'profile', 'contact'],
  player: ['dashboard', 'competition', 'schedule', 'stats', 'videos', 'calendar', 'store', 'profile', 'contact'],
}

const baseLinks: Omit<NavLink, 'url'>[] = [
  { id: 'dashboard', icon: 'home', title: 'Inicio' },
  { id: 'profile', icon: 'account_circle', title: 'Perfil' },
  { id: 'competition', icon: 'sports_soccer', title: 'El Camerino' },
  { id: 'schedule', icon: 'calendar_month', title: 'La Jornada' },
  { id: 'stats', icon: 'analytics', title: 'La Pizarra' },
  { id: 'videos', icon: 'video_library', title: 'Encuentros' },
  { id: 'store', icon: 'store', title: 'Tienda' },
  { id: 'contact', icon: 'mail', title: 'Contacto' },
]

const allLinks = computed(() => {
  const rolePrefix = `/${role.value}`;
  return baseLinks.map(link => ({
    ...link,
    url: link.id === 'dashboard' ? rolePrefix :
         link.id === 'scraping' ? `${rolePrefix}/scraping` :
         link.id === 'competition' ? `${rolePrefix}/tournaments/competition` :
         link.id === 'schedule' ? `${rolePrefix}/tournaments/schedule` :
         link.id === 'stats' ? `${rolePrefix}/tournaments/stats` :
         link.id === 'profile' ? `${rolePrefix}/profile` :
         link.id === 'contact' ? `${rolePrefix}/contact` :
         link.id === 'videos' ? `${rolePrefix}/videos` :
         `${rolePrefix}/${link.id}`
  }));
})

const visibleLinks = computed(() => {
  return allLinks.value.filter(l => rolePermissions[role.value]?.includes(l.id))
})

function go(path: string) {
  void router.push(path)
}

function goToProfile() {
  const rolePrefix = `/${role.value}`;
  void router.push(`${rolePrefix}/profile`)
}

async function logOut() {
  await userStore.logout()
  void router.push('/login')
}

onMounted(() => {
  loaded.value = true
})
</script>

<style scoped lang="scss">

.avatar-container {
  position: relative;
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 50%;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}
.q-item__label {
  font-weight: 600;
}

.q-icon {
  font-size: 20px;
}
</style>
