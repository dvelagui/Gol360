<template>
  <q-form @submit.prevent="submit" class="event-form">
    <!-- Sección de información básica -->
    <div class="form-section">
      <div class="section-title">
        <q-icon name="info" color="primary" size="sm" class="q-mr-xs" />
        <span>Información del Evento</span>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Tipo de evento -->
        <div class="col-12">
          <q-select
            v-model="form.type"
            :options="typeOptionsFormatted"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Tipo de evento"
            filled
            :color="getEventColor(form.type)"
            :rules="[val => !!val || 'Selecciona un tipo de evento']"
          >
            <template #prepend>
              <q-icon :name="getEventIcon(form.type)" :color="getEventColor(form.type)" />
            </template>
            <template #selected>
              <div class="selected-event">
                <q-icon :name="getEventIcon(form.type)" :color="getEventColor(form.type)" size="20px" class="q-mr-xs" />
                {{ getEventLabel(form.type) }}
              </div>
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="getEventIcon(scope.opt.value)" :color="getEventColor(scope.opt.value)" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Equipo -->
        <div class="col-12 col-sm-6">
          <q-select
            v-model="form.teamId"
            :options="optionsTeam"
            option-label="label"
            label="Equipo"
            filled
            color="primary"
            :rules="[val => !!val?.id || 'Selecciona un equipo']"
          >
            <template #prepend>
              <q-icon name="groups" color="primary" />
            </template>
          </q-select>
        </div>

        <!-- Jugador -->
        <div class="col-12 col-sm-6">
          <q-select
            v-model="form.playerId"
            :options="players"
            option-value="id"
            option-label="name"
            label="Jugador"
            filled
            color="primary"
            :loading="loadingPlayers"
            :disable="!form.teamId?.id"
            :hint="!form.teamId?.id ? 'Selecciona primero un equipo' : ''"
            :rules="[val => !!val?.id || 'Selecciona un jugador']"
          >
            <template #prepend>
              <q-icon name="person" color="primary" />
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey-6 text-center">
                  <div v-if="!form.teamId?.id">Selecciona un equipo primero</div>
                  <div v-else>No hay jugadores registrados</div>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </div>
    </div>

    <!-- Sección de tiempo -->
    <div class="form-section">
      <div class="section-title">
        <q-icon name="schedule" color="primary" size="sm" class="q-mr-xs" />
        <span>Momento del Evento</span>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.minute"
            type="number"
            label="Minuto"
            filled
            color="primary"
            min="0"
            max="120"
            :rules="[
              val => val >= 0 || 'El minuto no puede ser negativo',
              val => val <= 120 || 'El minuto no puede ser mayor a 120'
            ]"
          >
            <template #prepend>
              <q-icon name="timer" color="primary" />
            </template>
            <template #append>
              <span class="text-caption text-grey-6">min</span>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.extraTime"
            type="number"
            label="Tiempo adicional (opcional)"
            filled
            clearable
            color="primary"
            min="0"
            max="20"
            hint="Ej: +3 minutos de descuento"
          >
            <template #prepend>
              <q-icon name="add_circle" color="orange" />
            </template>
            <template #append>
              <span v-if="form.extraTime" class="text-caption text-orange">+{{ form.extraTime }}</span>
            </template>
          </q-input>
        </div>
      </div>
    </div>

    <!-- Sección de descripción -->
    <div class="form-section">
      <div class="section-title">
        <q-icon name="notes" color="primary" size="sm" class="q-mr-xs" />
        <span>Detalles Adicionales</span>
      </div>

      <q-input
        v-model="form.metaDescription"
        type="textarea"
        label="Descripción (opcional)"
        filled
        autogrow
        color="primary"
        counter
        maxlength="500"
        hint="Añade detalles sobre el evento"
        rows="3"
      >
        <template #prepend>
          <q-icon name="description" color="primary" />
        </template>
      </q-input>
    </div>

    <!-- Toggle de aprobación (solo admin/manager) -->
    <div v-if="canSetApproved" class="form-section approval-section">
      <q-toggle
        v-model="form.status"
        true-value="aprobado"
        false-value="propuesto"
        color="positive"
        size="lg"
      >
        <template #default>
          <div class="toggle-label">
            <q-icon
              :name="form.status === 'aprobado' ? 'check_circle' : 'schedule'"
              :color="form.status === 'aprobado' ? 'positive' : 'warning'"
              size="24px"
              class="q-mr-sm"
            />
            <div>
              <div class="text-weight-bold">
                {{ form.status === 'aprobado' ? 'Aprobar inmediatamente' : 'Guardar como propuesto' }}
              </div>
              <div class="text-caption text-grey-7">
                {{ form.status === 'aprobado' ? 'El evento se aprobará y contará en el marcador' : 'El evento necesitará aprobación posterior' }}
              </div>
            </div>
          </div>
        </template>
      </q-toggle>
    </div>

    <!-- Botones de acción -->
    <div class="action-buttons">
      <q-btn
        flat
        label="Cancelar"
        color="grey-7"
        @click="$emit('cancel')"
        class="btn-cancel"
      />
      <q-btn
        type="submit"
        label="Agregar Evento"
        color="primary"
        unelevated
        icon="add_circle"
        class="btn-submit"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EventType } from '@/types/competition'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/players'

const props = defineProps<{
  matchId: string
  teamHome: { id: string; name: string }
  teamAway: { id: string; name: string }
  tournamentId: string
  teams: { id: string; name: string }[]
  canApprove?: boolean
  defaultTeamId?: string
}>()

const emit = defineEmits<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (e: 'submit', payload: any): void
  (e: 'cancel'): void
}>()

const userStore = useUserStore()
const playerStore = usePlayerStore()

const optionsTeam = [
  { label: props.teamHome.name, id: props.teamHome.id },
  { label: props.teamAway.name, id: props.teamAway.id },
]

const typeOptions: EventType[] = [
  'gol',
  'penalti_marcado',
  'penalti_fallado',
  'autogol',
  'asistencia',
  'amarilla',
  'roja',
  'sub_id',
  'sub_out'
]

const typeOptionsFormatted = computed(() =>
  typeOptions.map(type => ({
    label: getEventLabel(type),
    value: type
  }))
)

const form = ref({
  teamId: optionsTeam[0],
  playerId: null as { id: string; name: string } | null,
  type: 'gol' as EventType,
  minute: 0,
  extraTime: null as number | null,
  metaDescription: '',
  status: 'propuesto' as 'propuesto' | 'aprobado'
})

const canSetApproved = computed(() => !!props.canApprove)
const players = ref<{ id: string; name: string }[]>([])
const loadingPlayers = ref(false)

// Cargar jugadores cuando cambia el equipo
watch(() => form.value.teamId, async (teamId) => {
  if (teamId?.id) {
    loadingPlayers.value = true
    try {
      // Usar el nuevo sistema de participaciones
      await playerStore.fetchByTeamWithParticipations(teamId.id)
      players.value = playerStore.items.map(p => ({ id: p.id, name: p.displayName }))
    } catch (error) {
      console.error('Error loading players:', error)
      players.value = []
    } finally {
      loadingPlayers.value = false
    }
  } else {
    players.value = []
  }
}, { immediate: true })

function getEventIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    gol: 'sports_soccer',
    penalti_marcado: 'sports_soccer',
    penalti_fallado: 'cancel',
    autogol: 'sync_problem',
    asistencia: 'sports',
    amarilla: 'square',
    roja: 'stop',
    sub_id: 'arrow_circle_up',
    sub_out: 'arrow_circle_down'
  }
  return icons[type] || 'event'
}

function getEventColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    gol: 'positive',
    penalti_marcado: 'positive',
    penalti_fallado: 'negative',
    autogol: 'warning',
    asistencia: 'info',
    amarilla: 'warning',
    roja: 'negative',
    sub_id: 'primary',
    sub_out: 'grey'
  }
  return colors[type] || 'primary'
}

function getEventLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    gol: 'Gol',
    penalti_marcado: 'Penalti (Gol)',
    penalti_fallado: 'Penalti (Fallado)',
    autogol: 'Autogol',
    asistencia: 'Asistencia',
    amarilla: 'Tarjeta Amarilla',
    roja: 'Tarjeta Roja',
    sub_id: 'Substitución (Entra)',
    sub_out: 'Substitución (Sale)'
  }
  return labels[type] || type
}

function submit() {
  const payload = {
    matchId: props.matchId,
    tournamentId: props.tournamentId,
    teamId: form.value.teamId,
    playerId: form.value.playerId,
    type: form.value.type,
    minute: Number(form.value.minute || 0),
    extraTime: form.value.extraTime ? Number(form.value.extraTime) : null,
    meta: form.value.metaDescription ? { description: form.value.metaDescription } : undefined,
    status: canSetApproved.value ? form.value.status : 'propuesto',
    createdBy: userStore.user?.uid || ''
  }
  emit('submit', payload)

  // Reset form
  form.value.minute = 0
  form.value.extraTime = null
  form.value.metaDescription = ''
  form.value.playerId = null
}
</script>

<style scoped lang="scss">
.event-form {
  width: 100%;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: #064F34;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-event {
  display: flex;
  align-items: center;
}

.approval-section {
  background: linear-gradient(135deg, #f0f8ff 0%, #e8f5e9 100%);
  border: 2px solid rgba(6, 79, 52, 0.2);

  .toggle-label {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 0 4px;

  .btn-cancel,
  .btn-submit {
    min-width: 140px;
    font-weight: 600;
  }

  .btn-submit {
    background: linear-gradient(135deg, #064F34, #138A59);
  }
}

@media (max-width: 600px) {
  .form-section {
    padding: 16px;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 0.875rem;
    margin-bottom: 12px;
  }

  .action-buttons {
    flex-direction: column-reverse;
    gap: 8px;
    margin-top: 20px;

    .btn-cancel,
    .btn-submit {
      width: 100%;
      min-width: auto;
    }
  }

  .approval-section {
    .toggle-label {
      flex-direction: row;
      align-items: flex-start;
    }
  }
}
</style>
