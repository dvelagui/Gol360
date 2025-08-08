<template>
  <q-page class="row no-wrap full-height">
    <div class="col-12 col-md-7 q-pa-none">
      <q-img
        src="@/assets/img_login.png"
        class="full-height"
        style="object-fit: cover;"
      />
    </div>
    <div class="col-12 col-md-5 flex flex-column flex-center">

      <q-form
        @submit.prevent="handleLogin"
        class="q-pa-lg"
        style="max-width: 400px; width: 100%;"
      >
      <div class="row justify-center q-mb-lg">
          <q-img
            src="@/assets/logo.png"
            alt="Logo Gol360"
            style="max-width: 150px;"
            contain
          />
        </div>
        <div class="text-h4 q-mb-md">Iniciar sesión</div>
        <div class="text-subtitle2 q-mb-lg">
          Inicia sesión con tus datos de jugador
        </div>

        <q-input
          v-model="email"
          label="Correo electrónico"
          type="email"
          dense
          outlined
          class="q-mb-md"
          :rules="[ val => !!val || 'El email es requerido' ]"
        />

        <q-input
          v-model="password"
          label="Contraseña"
          type="password"
          dense
          outlined
          class="q-mb-xs"
          :rules="[ val => !!val || 'La contraseña es requerida' ]"
          :bottom-slots="true"
        >
          <template #append>
            <q-icon
  :name="showPassword ? 'visibility' : 'visibility_off'"
  @click="showPassword = !showPassword"
  class="cursor-pointer"
/>
          </template>
        </q-input>
        <div class="row justify-between items-center q-mb-lg">
          <q-btn flat label="¿Olvidaste tu contraseña?" @click="goToReset" />
          <q-btn
            label="Iniciar sesión"
            type="submit"
            color="primary"
            class="q-ml-sm"
            :loading="loading"
          />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { useUserStore } from '@/stores/user'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const router = useRouter()
const userStore = useUserStore()

async function handleLogin() {
  loading.value = true
  try {
    await userStore.login(email.value, password.value)
    router.push('/dashboard')
  }
  catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err.message || 'Error al iniciar sesión'
    })
  }
  finally {
    loading.value = false
  }
}

function goToReset() {
  router.push('/auth/reset-password')
}

</script>

<style scoped lang="scss">
.full-height {
  height: 100vh;
}

@media (max-width: 725px) {
  .q-page > div.col-md-7:first-child {
    display: none;
  }
}
</style>
