<template>
  <q-page class="row flex-center">
    <q-form @submit.prevent="onSubmit" class="q-pa-lg" style="max-width: 420px; width: 100%;">
      <div class="text-h5 q-mb-sm">Recuperar contraseña</div>
      <div class="text-caption q-mb-md">
        Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </div>

      <q-input
        v-model="email"
        type="email"
        label="Correo electrónico"
        outlined dense
        :rules="[v => !!v || 'El email es requerido']"
        class="q-mb-md"
      />

      <q-btn
        label="Enviar enlace"
        type="submit"
        color="primary"
        :loading="loading"
        class="full-width q-mb-sm"
      />

      <q-btn
        flat
        color="primary"
        label="Volver a iniciar sesión"
        class="full-width"
        @click="router.push('/login')"
      />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/user'
import { authErrorMessage } from '@/utils/firebaseErrors'

const email = ref('')
const loading = ref(false)
const router = useRouter()
const $q = useQuasar()
const userStore = useUserStore()

async function onSubmit () {
  loading.value = true
  try {
    await userStore.sendPasswordReset(email.value.trim())
    $q.notify({ type: 'positive', message: 'Te enviamos un enlace para restablecer tu contraseña.' })
    router.push('/login')
  } catch (err) {
    $q.notify({ type: 'negative', message: authErrorMessage(err) })
  } finally {
    loading.value = false
  }
}
</script>
