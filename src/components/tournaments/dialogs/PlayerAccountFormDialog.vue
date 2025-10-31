<template>
  <q-dialog v-model="model" persistent>
    <q-card class="player-form-dialog">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="row items-center no-wrap">
          <q-icon name="person_add" size="28px" class="q-mr-sm" />
          <div class="header-text">
            <div class="text-subtitle1 text-weight-bold">Nuevo jugador</div>
            <div class="text-caption">{{ teamName }}</div>
          </div>
          <q-space />
          <q-btn dense round flat icon="close" v-close-popup />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Form Content -->
      <q-card-section class="form-content">
        <div class="form-grid">
          <!-- Sección: Información Personal -->
          <div class="section-label">
            <q-icon name="badge" size="20px" class="q-mr-xs" />
            Información Personal
          </div>

          <q-input
            v-model="form.fullName"
            label="Nombre completo *"
            outlined
            :rules="[req]"
            class="form-input"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="form.email"
            label="Email *"
            type="email"
            outlined
            :rules="[req, emailRule]"
            :loading="checkingEmail"
            class="form-input"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
            <template #append v-if="existingPlayer">
              <q-icon name="info" color="warning">
                <q-tooltip>Este email ya está registrado: {{ existingPlayer.displayName }}</q-tooltip>
              </q-icon>
            </template>
          </q-input>

          <q-banner v-if="existingPlayer" class="bg-warning text-white q-mb-md" dense rounded>
            <template #avatar>
              <q-icon name="info" />
            </template>
            <b>{{ existingPlayer.displayName }}</b> ya tiene este email.<br>
            Al continuar, se agregará a este equipo.
          </q-banner>

          <q-input
            v-model="form.phone"
            label="Teléfono de contacto"
            outlined
            class="form-input"
          >
            <template #prepend>
              <q-icon name="phone" />
            </template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Contraseña *"
            type="password"
            outlined
            :rules="[req, passwordRule]"
            hint="Mínimo 6 caracteres"
            class="form-input"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <!-- Sección: Documentación -->
          <div class="section-label q-mt-md">
            <q-icon name="description" size="20px" class="q-mr-xs" />
            Documentación
          </div>

          <q-select
            v-model="form.docType"
            :options="docTypeOpts"
            label="Tipo de documento *"
            outlined
            :rules="[req]"
            emit-value
            map-options
            class="form-input"
          >
            <template #prepend>
              <q-icon name="credit_card" />
            </template>
          </q-select>

          <q-input
            v-model="form.docNumber"
            label="Número de documento *"
            outlined
            :rules="[req]"
            class="form-input"
          >
            <template #prepend>
              <q-icon name="numbers" />
            </template>
          </q-input>

          <!-- Sección: Información del Equipo -->
          <div class="section-label q-mt-md">
            <q-icon name="sports_soccer" size="20px" class="q-mr-xs" />
            Información del Equipo
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.position"
                label="Posición"
                outlined
                class="form-input"
              >
                <template #prepend>
                  <q-icon name="sports" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.jersey"
                type="number"
                label="Dorsal *"
                outlined
                :rules="[req]"
                class="form-input"
              >
                <template #prepend>
                  <q-icon name="tag" />
                </template>
              </q-input>
            </div>
          </div>

          <q-input
            v-model="form.photoURL"
            label="Foto (URL opcional)"
            outlined
            hint="Si no defines, se usa un avatar por defecto"
            class="form-input"
          >
            <template #prepend>
              <q-icon name="image" />
            </template>
          </q-input>

          <!-- Sección: Roles -->
          <div class="section-label q-mt-md">
            <q-icon name="admin_panel_settings" size="20px" class="q-mr-xs" />
            Roles y Permisos
          </div>

          <div class="roles-toggles">
            <q-card flat bordered class="role-card">
              <q-card-section class="q-pa-sm">
                <q-toggle
                  v-model="form.isCaptain"
                  color="warning"
                  label="Capitán del equipo"
                  class="full-width"
                />
                <div class="text-caption text-grey-7 q-pl-lg">
                  Puede gestionar el equipo y jugadores
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="role-card">
              <q-card-section class="q-pa-sm">
                <q-toggle
                  v-model="form.isCoach"
                  color="secondary"
                  label="Entrenador del equipo"
                  class="full-width"
                />
                <div class="text-caption text-grey-7 q-pl-lg">
                  Puede editar información de jugadores
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Información -->
          <q-banner class="info-banner q-mt-md" rounded>
            <template #avatar>
              <q-icon name="info" color="primary" />
            </template>
            Se creará una cuenta de usuario con la contraseña especificada.
            Podrás forzar cambio de contraseña más adelante.
          </q-banner>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Actions -->
      <q-card-actions class="dialog-actions">
        <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          :loading="saving"
          label="Crear jugador"
          icon-right="check"
          @click="onSubmit"
          class="action-btn"
        />
      </q-card-actions>
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
  isCoach: boolean
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
  isCoach: false,
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

    // Determinar el rol basado en las opciones seleccionadas
    let playerRole: 'player' | 'team' | 'coach' = 'player'
    if (form.isCoach) {
      playerRole = 'coach' // Entrenador tiene prioridad
    } else if (form.isCaptain) {
      playerRole = 'team' // Capitán
    }

    const playerData: Parameters<typeof playerStore.addWithAccountAndParticipation>[0] = {
      displayName: form.fullName.trim(),
      email: form.email.trim(),
      ...(trimmedPassword ? { password: trimmedPassword } : {}),
      photoURL: form.photoURL?.trim() || DEFAULT_PLAYER_AVATAR,
      tournamentId: props.tournamentId,
      teamId: props.team.id,
      role: playerRole,
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

    // Determinar el rol basado en las opciones seleccionadas
    let playerRole: 'player' | 'team' | 'coach' = 'player'
    if (form.isCoach) {
      playerRole = 'coach' // Entrenador tiene prioridad
    } else if (form.isCaptain) {
      playerRole = 'team' // Capitán
    }

    // Preparar datos de participación
    const playerData: Parameters<typeof playerStore.addWithParticipation>[0] = {
      displayName: player.displayName, // Usar nombre existente
      email: form.email.trim(),
      photoURL: player.photoURL || DEFAULT_PLAYER_AVATAR,
      tournamentId: props.tournamentId,
      teamId: props.team.id,
      role: playerRole,
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
  form.isCoach = false
  form.photoURL = ''
  existingPlayer.value = null
}
</script>

<style scoped lang="scss">
// Dialog Container
.player-form-dialog {
  max-width: 680px;
  width: 95vw;
  max-height: 90vh;
  border-radius: 16px;
}

// Header
.dialog-header {
  background: linear-gradient(135deg, #064F34, #138A59);
  color: white;
  padding: 16px 20px;

  .header-text {
    flex: 1;

    .text-subtitle1 {
      font-size: 1.1rem;
      line-height: 1.2;
    }

    .text-caption {
      opacity: 0.9;
      font-size: 0.85rem;
    }
  }

  .q-btn {
    color: white;
  }
}

// Form Content
.form-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 180px);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Section Labels
.section-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: #064F34;
  padding: 8px 0;
  border-bottom: 2px solid #E0E0E0;
  margin-bottom: 8px;
}

// Form Inputs
.form-input {
  :deep(.q-field__control) {
    border-radius: 8px;
  }

  :deep(.q-field__label) {
    font-weight: 500;
  }

  :deep(.q-field__prepend) {
    .q-icon {
      color: #064F34;
    }
  }
}

// Roles Toggles
.roles-toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-card {
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.q-toggle) {
    .q-toggle__label {
      font-weight: 600;
    }
  }
}

// Info Banner
.info-banner {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  font-size: 0.85rem;
  color: #666;
}

// Actions
.dialog-actions {
  padding: 16px 20px;
  background: #FAFAFA;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .action-btn {
    font-weight: 600;
    padding: 8px 24px;
  }
}

// Responsive - Mobile
@media (max-width: 599px) {
  .player-form-dialog {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }

  .dialog-header {
    padding: 12px 16px;

    .header-text {
      .text-subtitle1 {
        font-size: 1rem;
      }

      .text-caption {
        font-size: 0.75rem;
      }
    }

    .q-icon {
      font-size: 24px !important;
    }
  }

  .form-content {
    padding: 16px;
    max-height: calc(100vh - 160px);
  }

  .form-grid {
    gap: 12px;
  }

  .section-label {
    font-size: 0.9rem;
    padding: 6px 0;
    margin-bottom: 6px;

    .q-icon {
      font-size: 18px !important;
    }
  }

  .form-input {
    :deep(.q-field__control) {
      min-height: 48px;
    }

    :deep(.q-field__label) {
      font-size: 0.9rem;
    }

    :deep(.q-field__prepend) {
      .q-icon {
        font-size: 20px !important;
      }
    }
  }

  .role-card {
    :deep(.q-card__section) {
      padding: 10px 12px;
    }

    :deep(.q-toggle) {
      .q-toggle__label {
        font-size: 0.9rem;
      }
    }

    .text-caption {
      font-size: 0.75rem;
    }
  }

  .info-banner {
    font-size: 0.8rem;

    :deep(.q-banner__avatar) {
      .q-icon {
        font-size: 20px !important;
      }
    }
  }

  .dialog-actions {
    padding: 12px 16px;
    flex-direction: column-reverse;
    gap: 8px;

    .q-btn {
      width: 100%;
    }

    .action-btn {
      padding: 10px 20px;
    }
  }
}

// Small tablets
@media (min-width: 600px) and (max-width: 767px) {
  .player-form-dialog {
    width: 90vw;
  }

  .form-content {
    padding: 18px;
  }

  .dialog-actions {
    .q-btn {
      min-width: 120px;
    }
  }
}
</style>
