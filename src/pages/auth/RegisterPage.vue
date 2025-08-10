<template>
  <q-page class="q-pa-md flex flex-center">
    <q-form @submit.prevent="handleRegister" class="q-gutter-md" style="max-width:420px;width:100%">
      <q-input v-model="displayName" label="Nombre" outlined dense />
      <q-input v-model="email" label="Correo" type="email" outlined dense />
      <q-input v-model="password" label="Contraseña" :type="show ? 'text':'password'" outlined dense>
        <template #append>
          <q-icon :name="show ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="show=!show" />
        </template>
      </q-input>

      <q-select
        v-model="role"
        :options="roles"
        label="Rol"
        outlined dense emit-value map-options
      />

      <div class="row justify-end">
        <q-btn label="Crear cuenta" type="submit" color="primary" :loading="loading" />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Notify } from 'quasar'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Role } from '@/types/auth'

const roles = [
  { label: 'Jugador', value: 'player' },
  { label: 'Capitán', value: 'team' },
  { label: 'Organizador', value: 'manager' },
  { label: 'Administrador', value: 'admin' }
] as const

const email = ref('')
const password = ref('')
const displayName = ref('')
const role = ref<Role>('player')
const loading = ref(false)
const show = ref(false)

const userStore = useUserStore()
const router = useRouter()

async function handleRegister() {
  try {
    loading.value = true
    await userStore.register({
      email: email.value,
      password: password.value,
      displayName: displayName.value,
      role: role.value
    })
    await router.push('/')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No pudimos crear la cuenta'
    Notify.create({ type: 'negative', message })
  } finally {
    loading.value = false
  }
}
</script>
