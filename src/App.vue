<template>
  <div>
    <!-- Notificación de actualización (solo en PWA) -->
    <UpdateNotification />

    <!-- Contenido de la app -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import UpdateNotification from '@/components/common/UpdateNotification.vue'

const userStore = useUserStore()

onMounted(async () => {
  await userStore.fetchUserOnAuthChange()
})
</script>
