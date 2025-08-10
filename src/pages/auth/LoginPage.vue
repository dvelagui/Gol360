<template>
      <q-form @submit.prevent="handleLogin" class="q-pa-lg" style="max-width: 400px; width: 100%;">
        <div class="row justify-center q-mb-lg">
          <q-img src="@/assets/logo.png" alt="Logo Gol360" style="max-width: 150px;" contain />
        </div>
        <div class="text-h4 q-mb-md">Iniciar sesión</div>
        <div class="text-subtitle2 q-mb-lg">
          Inicia sesión con tus datos de jugador
        </div>

        <q-input v-model="email" label="Correo electrónico" type="email" dense outlined class="q-mb-md"
          :rules="[val => !!val || 'El email es requerido']" />

        <q-input v-model="password" label="Contraseña" :type="showPassword ? 'text' : 'password'" dense outlined
          class="q-mb-xs" :rules="[val => !!val || 'La contraseña es requerida']">
          <template #append>
            <q-icon :name="showPassword ? 'visibility' : 'visibility_off'" class="cursor-pointer"
              @click="showPassword = !showPassword" />
          </template>
        </q-input>
        <div class="row justify-between items-center q-mb-lg">
          <div class="col-12">
            <p><span class="text-primary cursor-pointer" @click="goToReset">¿Olvidaste tu
                contraseña?</span></p>
          </div>
          <q-btn label="Iniciar sesión" type="submit" color="primary" class="q-my-sm" :loading="loading" />
        <div class="col-12 text-subtitle1 q-mt-lg">
          Convierte tu torneo en una experiencia profesional
        </div>
        <div class="col-12 text-subtitle1">
          <span class="text-primary cursor-pointer" @click="goToContact"><q-icon name="fa-brands fa-whatsapp"/> Contáctanos</span>
        </div>
        </div>
      </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/user'
import { authErrorMessage } from '@/utils/firebaseErrors'
import AuthErrorDialog from '@/components/common/AuthErrorDialog.vue'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const $q = useQuasar()
const router = useRouter()
const userStore = useUserStore()

async function handleLogin() {
  loading.value = true
  try {
    await userStore.login(email.value, password.value)
    console.log('Login successful, redirecting to dashboard...');
    void router.replace('/')
  }
  catch (err) {
  $q.dialog({
    component: AuthErrorDialog,
    componentProps: { message: authErrorMessage(err) }
  }).onCancel(() => { void router.push('/auth/reset-password'); })
}
  finally {
    loading.value = false
  }
}

function goToReset() {
void router.push('/auth/reset-password');
}

function goToContact() {
void router.push('/');
}

</script>

<style scoped lang="scss">
.full-height {
  height: 100vh;
}

@media (max-width: 725px) {
  .q-page>div.col-md-7:first-child {
    display: none;
  }
}
</style>
