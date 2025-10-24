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
            :loading="checkingEmail"
          >
            <template #append v-if="existingPlayer">
              <q-icon name="info" color="warning">
                <q-tooltip>Este email ya está registrado: {{ existingPlayer.displayName }}</q-tooltip>
              </q-icon>
            </template>
          </q-input>
          <q-banner v-if="existingPlayer" class="bg-warning text-white q-mb-md" dense>
            <template #avatar>
              <q-icon name="info" />
            </template>
            <b>{{ existingPlayer.displayName }}</b> ya tiene este email.<br>
            Al continuar, se agregará a este equipo.
          </q-banner>
          <q-input
            v-model="form.phone"
            label="Teléfono de contacto (opcional)"
            dense filled
            class="q-mb-md"
          />
          <q-input
            v-model="form.password"
            label="Contraseña"
            type="password"
            dense filled
            :rules="[req, passwordRule]"
            hint="Mínimo 6 caracteres"
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
          Se creará una cuenta en Authentication con la contraseña especificada.
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
import { computed, reactive, ref, watch } from 'vue'
import { Notify, Dialog } from 'quasar'
import { req, emailRule, passwordRule } from '@/utils/formValidators'
import { usePlayerStore } from '@/stores/players'
import { useUserStore } from '@/stores/user'
import type { Team, Player } from '@/types/auth'

const DEFAULT_PLAYER_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/gol360-app.firebasestorage.app/o/avatar%2Fplayer.png?alt=media&token=0175081b-9761-4acb-9e15-a77baf10b7f0'

const playerStore = usePlayerStore()
const userStore = useUserStore()

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
  password: string
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
  password: '',
  docType: '' as Form['docType'],
  docNumber: '',
  phone: '',
  position: '',
  jersey: undefined,
  isCaptain: false,
  photoURL: '',
})

const saving = ref(false)
const existingPlayer = ref<Player | null>(null)
const checkingEmail = ref(false)
let emailCheckTimeout: ReturnType<typeof setTimeout> | null = null

// Función para verificar email duplicado
async function checkEmailDuplicate(email: string) {
  try {
    const player = await playerStore.findByEmail(email.trim())
    existingPlayer.value = player
  } catch (error) {
    console.error('Error checking email:', error)
    existingPlayer.value = null
  } finally {
    checkingEmail.value = false
  }
}

// Detectar email duplicado mientras el usuario escribe (con debounce manual)
watch(() => form.email, (newEmail) => {
  // Limpiar timeout anterior
  if (emailCheckTimeout) {
    clearTimeout(emailCheckTimeout)
  }

  // Resetear si el email está vacío o inválido
  if (!newEmail || newEmail.trim() === '' || !emailRule(newEmail)) {
    existingPlayer.value = null
    checkingEmail.value = false
    return
  }

  // Indicar que se está verificando
  checkingEmail.value = true

  // Esperar 500ms antes de hacer la búsqueda
  emailCheckTimeout = setTimeout(() => {
    void checkEmailDuplicate(newEmail)
  }, 500)
})

function onSubmit() {
  if (!props.tournamentId || !props.team?.id) return

  const email = form.email.trim()

  // Si existe jugador con ese email, preguntar si agregar a este equipo
  if (existingPlayer.value) {
    Dialog.create({
      title: '¿Agregar jugador existente?',
      message: `El email "${email}" ya pertenece a <b>${existingPlayer.value.displayName}</b>.<br><br>¿Deseas agregar este jugador a <b>${props.team.displayName}</b> en este torneo?`,
      html: true,
      cancel: {
        label: 'Cancelar',
        flat: true,
        color: 'grey-7'
      },
      ok: {
        label: 'Sí, agregar al equipo',
        color: 'primary',
        unelevated: true
      },
      persistent: true
    }).onOk(() => {
      void addExistingPlayerToTeam(existingPlayer.value!)
    })
    return
  }

  // No existe, crear nuevo jugador con cuenta
  void createNewPlayer()
}

async function createNewPlayer() {
  if (!props.tournamentId || !props.team?.id) return

  try {
    saving.value = true

    // Preparar datos del jugador CON cuenta de autenticación
    const trimmedPassword = form.password.trim()
    const playerData: Parameters<typeof playerStore.addWithAccountAndParticipation>[0] = {
      displayName: form.fullName.trim(),
      email: form.email.trim(),
      ...(trimmedPassword ? { password: trimmedPassword } : {}),
      photoURL: form.photoURL?.trim() || DEFAULT_PLAYER_AVATAR,
      tournamentId: props.tournamentId,
      teamId: props.team.id,
      role: form.isCaptain ? 'team' : 'player',
      createdBy: userStore.user?.uid || ''
    }

    // Solo agregar campos opcionales si tienen valor
    if (form.position?.trim()) {
      playerData.position = form.position.trim()
    }
    if (form.jersey !== undefined && form.jersey !== null) {
      playerData.jersey = form.jersey
    }

    const result = await playerStore.addWithAccountAndParticipation(playerData)

    Notify.create({
      type: 'positive',
      message: `Jugador creado: ${form.fullName}`,
      caption: result.isExisting ? 'Participación agregada' : 'Nuevo jugador con cuenta creado'
    })

    emit('created', result.playerId)
    resetForm()
    model.value = false
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo crear el jugador'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    saving.value = false
  }
}

async function addExistingPlayerToTeam(player: Player) {
  if (!props.tournamentId || !props.team?.id) return

  try {
    saving.value = true

    // Preparar datos de participación
    const playerData: Parameters<typeof playerStore.addWithParticipation>[0] = {
      displayName: player.displayName, // Usar nombre existente
      email: form.email.trim(),
      photoURL: player.photoURL || DEFAULT_PLAYER_AVATAR,
      tournamentId: props.tournamentId,
      teamId: props.team.id,
      role: form.isCaptain ? 'team' : 'player',
      createdBy: userStore.user?.uid || ''
    }

    // Solo agregar campos opcionales si tienen valor
    if (form.position?.trim()) {
      playerData.position = form.position.trim()
    }
    if (form.jersey !== undefined && form.jersey !== null) {
      playerData.jersey = form.jersey
    }

    // Agregar participación al jugador existente
    const result = await playerStore.addWithParticipation(playerData)

    if (result.isExisting) {
      Notify.create({
        type: 'warning',
        message: `${player.displayName} ya participa en este equipo/torneo`
      })
    } else {
      Notify.create({
        type: 'positive',
        message: `${player.displayName} agregado al equipo`,
        caption: 'Participación creada exitosamente'
      })
    }

    emit('created', result.playerId)
    resetForm()
    model.value = false
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo agregar el jugador'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.fullName = ''
  form.email = ''
  form.password = ''
  form.docType = ''
  form.docNumber = ''
  form.phone = ''
  form.position = ''
  form.jersey = undefined
  form.isCaptain = false
  form.photoURL = ''
  existingPlayer.value = null
}
</script>
