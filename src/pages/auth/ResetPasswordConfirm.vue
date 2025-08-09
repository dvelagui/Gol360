<template>
  <q-page class="row flex-center">
    <q-form @submit.prevent="onSubmit" class="q-pa-lg" style="max-width: 420px; width: 100%;">
      <div class="text-h5 q-mb-xs">Crear nueva contraseña</div>
      <div v-if="email" class="text-caption q-mb-md">Para: <b>{{ email }}</b></div>

      <q-input
        v-model="password"
        :type="show ? 'text' : 'password'"
        label="Nueva contraseña"
        outlined dense
        class="q-mb-sm"
        :rules="[v => !!v || 'La contraseña es requerida', v => v.length >= 6 || 'Mínimo 6 caracteres']"
      >
        <template #append>
          <q-icon :name="show ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="show = !show" />
        </template>
      </q-input>

      <q-input
        v-model="password2"
        :type="show2 ? 'text' : 'password'"
        label="Repite la contraseña"
        outlined dense
        class="q-mb-md"
        :rules="[v => v === password || 'Las contraseñas no coinciden']"
      >
        <template #append>
          <q-icon :name="show2 ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="show2 = !show2" />
        </template>
      </q-input>

      <q-btn label="Guardar contraseña" type="submit" color="primary" :loading="loading" class="full-width q-mb-sm" />
      <q-btn flat color="primary" label="Volver a iniciar sesión" class="full-width" @click="router.push('/auth/login')" />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/user'
import { authErrorMessage } from '@/utils/firebaseErrors'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const userStore = useUserStore()

const email = ref<string | null>(null)
const password = ref('')
const password2 = ref('')
const show = ref(false)
const show2 = ref(false)
const loading = ref(false)
const oobCode = ref<string | null>(null)

onMounted(async () => {
  const code = (route.query.oobCode as string) || null
  if (!code) {
    console.log("Código de restablecido.");
    return  void router.push('/login')
  }
  oobCode.value = code
  try {
    email.value = await userStore.verifyResetCode(code)
  } catch (err) {
    console.log(err);
    void router.push('/login')
  }
})

async function onSubmit () {
  if (!oobCode.value) return
  loading.value = true
  try {
    await userStore.confirmNewPassword(oobCode.value, password.value)
    $q.notify({ type: 'positive', message: 'Contraseña actualizada. Inicia sesión.' })
    void router.push('/login')
  } catch (err) {
    $q.notify({ type: 'negative', message: authErrorMessage(err) })
  } finally {
    loading.value = false
  }
}
</script>
