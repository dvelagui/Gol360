<template>
  <q-dialog v-model="model" persistent>
    <q-card class="q-pa-lg q-gutter-md" style="max-width: 720px; width: 100%">
      <div class="row items-center bg-primary text-white q-pa-md full-width">
        <div class="text-subtitle1">Nuevo jugador — {{ teamName }}</div>
        <q-space />
        <q-btn dense round flat icon="close" v-close-popup />
      </div>

      <q-separator />

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.fullName"
            label="Nombre completo"
            dense filled
            :rules="[req]"
          />
          <q-input
            v-model="form.email"
            label="Email"
            dense filled
            :rules="[req, emailRule]"
          />
          <q-input
            v-model="form.phone"
            label="Teléfono de contacto (opcional)"
            dense filled
            class="q-mb-md"
          />

          <q-select
            v-model="form.docType"
            :options="docTypeOpts"
            label="Tipo de documento"
            dense filled
            :rules="[req]"
            emit-value map-options
          />
          <q-input
            v-model="form.docNumber"
            label="Número de documento"
            dense filled
            :rules="[req]"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.position"
            label="Posición (opcional)"
            dense filled
            class="q-mb-md"
          />
          <q-input
            v-model.number="form.jersey"
            type="number"
            label="Dorsal"
            dense filled
            :rules="[req]"
          />
          <q-input
          v-model="form.photoURL"
          label="Foto (URL opcional)"
          dense filled
          hint="Si no defines, se usa un avatar por defecto"
          />
          <q-toggle
            v-model="form.isCaptain"
            color="warning"
            label="Marcar como Capitán"
            class="q-my-md"
          />
        </div>
        <q-banner class="bg-grey-2 text-grey-8 q-mt-md">
          Se creará una cuenta en Authentication con la contraseña <b>12345</b>.
          Luego podrás forzar cambio de contraseña.
        </q-banner>
      </div>

      <q-separator />

      <div class="row justify-end q-gutter-sm">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          color="primary"
          :loading="saving"
          label="Crear jugador"
          @click="onSubmit"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Notify } from 'quasar'
import { createPlayerWithAccount } from '@/services/accountService'
import { req, emailRule } from '@/utils/formValidators'
import type { Team } from '@/types/auth'

const DEFAULT_PLAYER_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/gol360-app.firebasestorage.app/o/avatar%2Fplayer.png?alt=media&token=0175081b-9761-4acb-9e15-a77baf10b7f0'

const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  team: Team | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', playerId: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const teamName = computed(() => props.team?.displayName ?? '')

const docTypeOpts = [
  { label: 'Cédula de Ciudadanía (CC)', value: 'CC' },
  { label: 'Tarjeta de Identidad (TI)', value: 'TI' },
  { label: 'Tarjeta de Extranjería (TE)', value: 'TE' },
]

type Form = {
  fullName: string
  email: string
  docType: 'CC'|'TI'|'TE'|''
  docNumber: string
  phone?: string | undefined
  position?: string | undefined
  jersey?: number | undefined
  isCaptain: boolean
  photoURL?: string | undefined
}
const form = reactive<Form>({
  fullName: '',
  email: '',
  docType: '' as Form['docType'],
  docNumber: '',
  phone: '',
  position: '',
  jersey: undefined,
  isCaptain: false,
  photoURL: '',
})

const saving = ref(false)

async function onSubmit() {
  if (!props.tournamentId || !props.team?.id) return
  try {
    saving.value = true
    const playerData: {
      tournamentId: string
      teamId: string
      fullName: string
      email: string
      position?: string
      jersey?: number
      photoURL?: string
    } = {
      tournamentId: props.tournamentId,
      teamId: props.team.id,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      photoURL: form.photoURL?.trim() || DEFAULT_PLAYER_AVATAR,
    }
    if (form.position && form.position.trim() !== '') {
      playerData.position = form.position.trim()
    }
    if (typeof form.jersey === 'number') {
      playerData.jersey = form.jersey
    }
    const playerId = await createPlayerWithAccount(playerData)
    Notify.create({ type: 'positive', message: 'Jugador creado y cuenta generada' })
    emit('created', playerId)
    model.value = false
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo crear el jugador'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    saving.value = false
  }
}
</script>
