<template>
  <q-layout view="lHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" v-if="isLoggedIn" />
        <q-toolbar-title>Gol360</q-toolbar-title>
        <div v-if="isLoggedIn" class="row items-center q-gutter-sm">
          <q-btn dense flat round icon="logout" @click="handleLogout" />
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer solo si hay sesión -->
    <q-drawer
      v-if="isLoggedIn"
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      bordered
    >
      <EssentialLink title="Home" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import EssentialLink from '@/components/EssentialLink.vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const leftDrawerOpen = ref(false)
const isLoggedIn = computed(() => !!userStore.user)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function handleLogout () {
  try {
    await userStore.logout()
    leftDrawerOpen.value = false
    void router.push('/login')
  } catch (e) {
    console.error('Logout error:', e)
  }
}
</script>
