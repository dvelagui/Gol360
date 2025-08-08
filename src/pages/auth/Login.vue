<template>
  <q-page class="q-pa-md flex flex-center">
    <q-form @submit="handleLogin" class="q-gutter-md" style="width: 300px">
      <q-input v-model="email" label="Email" type="email" />
      <q-input v-model="password" label="Password" type="password" />
      <q-btn label="Ingresar" type="submit" color="primary" :loading="loading" />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const email = ref('')
const password = ref('')
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

async function handleLogin() {
  try {
    loading.value = true
    await userStore.login(email.value, password.value)
    router.push('/dashboard') // o '/dashboard-jugador'
  } catch (error: any) {
    Notify.create({
      type: 'negative',
      message: 'Correo o contraseña incorrectos'
    })
  } finally {
    loading.value = false
  }
}
</script>
