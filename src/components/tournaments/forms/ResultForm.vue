<template>
  <div class="results-form-container">
    <div class="form-section score-section">
      <div class="section-header">
        <q-icon name="sports_score" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle2 text-primary text-weight-bold">Marcador Final</span>
        <q-space />
        <q-badge
          v-if="props.match.status === 'terminado'"
          color="positive"
          icon="check_circle"
          label="Finalizado"
        />
        <q-badge
          v-else-if="props.match.status === 'en progreso'"
          color="warning"
          icon="schedule"
          label="En Curso"
        />
        <q-badge
          v-else
          color="grey"
          icon="event"
          label="Programado"
        />
      </div>

      <div class="score-input-container">
        <div class="team-score home-team">
          <div class="team-info">
            <q-icon name="home" color="green" size="sm" class="q-mr-xs" />
            <span class="team-name">{{ homeName }}</span>
          </div>
          <q-input
            v-model.number="home"
            type="number"
            min="0"
            :disable="!canEdit"
            :rules="[val => val >= 0 || 'No puede ser negativo']"
            class="score-input"
            standout="bg-green-1"
            input-class="text-center text-h4 text-weight-bold"
          >
            <template #prepend>
              <q-icon name="sports_soccer" color="green" />
            </template>
          </q-input>
        </div>

        <div class="vs-divider">
          <div class="vs-text">VS</div>
        </div>

        <div class="team-score away-team">
          <div class="team-info">
            <q-icon name="flight_takeoff" color="orange" size="sm" class="q-mr-xs" />
            <span class="team-name">{{ awayName }}</span>
          </div>
          <q-input
            v-model.number="away"
            type="number"
            min="0"
            :disable="!canEdit"
            :rules="[val => val >= 0 || 'No puede ser negativo']"
            class="score-input"
            standout="bg-orange-1"
            input-class="text-center text-h4 text-weight-bold"
          >
            <template #prepend>
              <q-icon name="sports_soccer" color="orange" />
            </template>
          </q-input>
        </div>
      </div>

      <div class="score-comparison">
        <q-banner
          v-if="hasScoreDiscrepancy"
          class="bg-warning text-dark"
          dense
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>
          <div class="text-body2">
            <strong>Atención:</strong> El marcador manual ({{ home }} - {{ away }}) no coincide con los eventos aprobados ({{ approvedScore.home }} - {{ approvedScore.away }})
          </div>
        </q-banner>
        <div v-else class="text-caption text-grey-7 text-center">
          <q-icon name="check_circle" color="positive" class="q-mr-xs" />
          Goles por eventos aprobados: {{ approvedScore.home }} - {{ approvedScore.away }}
        </div>
      </div>

      <div class="action-buttons">
        <q-btn
          flat
          color="primary"
          icon="add"
          label="Agregar Evento"
          @click="$emit('addEvent')"
          class="q-mr-sm"
        />
        <q-btn
          v-if="canEdit"
          color="primary"
          icon="check_circle"
          label="Confirmar Final"
          @click="confirmFinal"
          :disable="hasValidationErrors"
          unelevated
        />
      </div>
    </div>

    <q-separator class="q-my-lg" />

    <div class="form-section analysis-section">
      <div class="section-header">
        <q-icon name="analytics" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle2 text-primary text-weight-bold">Análisis Avanzado</span>
        <q-space />
        <q-chip
          v-if="analysisJob.jobId"
          :color="getJobStatusColor(analysisJob.status)"
          :text-color="getJobStatusTextColor()"
          :icon="getJobStatusIcon(analysisJob.status)"
          dense
        >
          {{ getJobStatusLabel(analysisJob.status) }}
        </q-chip>
      </div>

      <div class="veo-url-section q-mb-md">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="link" class="q-mr-xs" />
          URL del partido en Veo.co
        </div>

        <div class="url-constructor">
          <div class="url-base">
            <q-input
              :model-value="VEO_BASE_URL"
              label="URL base"
              readonly
              filled
              dense
              class="base-url-input"
            />
          </div>

          <div class="url-slug">
            <q-input
              v-model="veoMatchSlug"
              label="Slug del partido"
              placeholder="20250831-cream-helado-vs-dilex-b1c3bc60"
              hint="Copia el ID del partido desde la URL de Veo.co"
              filled
              dense
              :rules="[val => !!val || 'Ingresa el slug del partido']"
            >
              <template #prepend>
                <q-icon name="sports_soccer" />
              </template>
            </q-input>
          </div>
        </div>

        <div v-if="veoMatchSlug" class="url-preview q-mt-sm">
          <q-banner class="bg-blue-1 text-blue-9" dense>
            <template #avatar>
              <q-icon name="preview" />
            </template>
            <div class="text-body2">
              <strong>URL completa:</strong><br>
              <code class="url-code">{{ constructedVeoUrl }}</code>
            </div>
          </q-banner>
        </div>
      </div>

      <div v-if="!analysisJob.jobId" class="analysis-actions q-mt-md">
        <div class="text-body2 text-grey-7 q-mb-md">
          Genera análisis avanzado del partido usando datos de Veo.co (estadísticas, mapas de calor, momentos destacados)
        </div>

        <q-btn
          color="primary"
          icon="analytics"
          label="Generar Análisis"
          @click="generateAnalysis"
          :disable="!veoMatchSlug || generatingAnalysis"
          :loading="generatingAnalysis"
          unelevated
          class="q-mr-sm"
        >
          <template #loading>
            <q-spinner-hourglass class="on-left" />
            Enviando...
          </template>
        </q-btn>
      </div>

      <div v-else-if="analysisJob.status === 'pending' || analysisJob.status === 'running'" class="analysis-status">
        <q-banner class="bg-warning text-dark" dense>
          <template #avatar>
            <q-spinner-dots color="warning" />
          </template>
          <div>
            <div class="text-body2">
              <strong>Análisis en proceso...</strong>
            </div>
            <div class="text-caption q-mt-xs">
              El procesamiento puede tardar hasta 1 hora. Mientras tanto puedes:
            </div>
            <ul class="q-ma-none q-pl-md q-mt-xs">
              <li>Agregar eventos como tarjetas o expulsiones</li>
              <li>Confirmar el marcador final</li>
              <li>Revisar los resultados en la sección Analytics</li>
            </ul>
          </div>
        </q-banner>

        <div class="analysis-actions q-mt-md">
          <q-btn
            flat
            color="primary"
            icon="refresh"
            label="Verificar Estado"
            @click="checkAnalysisStatus"
            :loading="checkingStatus"
            class="q-mr-sm"
          />

          <q-btn
            flat
            color="accent"
            icon="analytics"
            label="Ver Analytics"
            :to="`/tournaments/${props.match.tournamentId}/analytics`"
          />
        </div>
      </div>

      <div v-else-if="analysisJob.status === 'completed'" class="analysis-completed">
        <q-banner class="bg-positive text-white" dense>
          <template #avatar>
            <q-icon name="check_circle" />
          </template>
          <div class="text-body2">
            <strong>¡Análisis completado!</strong> Los datos están listos para visualizar.
          </div>
        </q-banner>

        <div class="analysis-actions q-mt-md">
          <q-btn
            color="accent"
            icon="analytics"
            label="Ver Resultados Completos"
            :to="`/tournaments/${props.match.tournamentId}/analytics`"
            unelevated
          />
        </div>
      </div>

      <div v-else-if="analysisJob.status === 'failed'" class="analysis-failed">
        <q-banner class="bg-negative text-white" dense>
          <template #avatar>
            <q-icon name="error" />
          </template>
          <div>
            <div class="text-body2">
              <strong>Error en el análisis</strong>
            </div>
            <div class="text-caption q-mt-xs">
              Hubo un problema procesando los datos. Puedes intentar de nuevo.
            </div>
          </div>
        </q-banner>

        <div class="analysis-actions q-mt-md">
          <q-btn
            color="primary"
            icon="refresh"
            label="Reintentar Análisis"
            @click="generateAnalysis"
            :disable="!veoMatchSlug || generatingAnalysis"
            :loading="generatingAnalysis"
          />
        </div>
      </div>
    </div>

    <q-separator class="q-my-lg" />

    <div class="form-section events-section">
      <div class="section-header">
        <q-icon name="event_note" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle2 text-primary text-weight-bold">Eventos del Partido</span>
        <q-space />
        <q-chip
          v-if="eventSummary.total > 0"
          color="primary"
          text-color="white"
          icon="sports_soccer"
          dense
        >
          {{ eventSummary.total }} eventos
        </q-chip>
      </div>

      <div v-if="eStore.loading" class="loading-events">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6" v-for="i in 3" :key="i">
            <q-card flat bordered class="q-pa-md">
              <q-skeleton type="rect" height="20px" width="60%" class="q-mb-sm" />
              <q-skeleton type="text" width="80%" />
              <q-skeleton type="text" width="40%" />
            </q-card>
          </div>
        </div>
      </div>

      <div v-else-if="eStore.items.length === 0" class="no-events">
        <q-icon name="event_busy" size="64px" color="grey-4" />
        <div class="text-subtitle2 text-grey-6 q-mt-md">No hay eventos registrados</div>
        <div class="text-caption text-grey-5">Los eventos aparecerán aquí cuando se agreguen</div>
      </div>

      <div v-else class="events-timeline">
        <q-timeline color="primary">
          <q-timeline-entry
            v-for="ev in eStore.items"
            :key="ev.id"
            :color="getEventColor(ev)"
            :icon="getEventIcon(ev.type)"
            class="event-entry"
          >
            <template #title>
              <div class="event-header">
                <div class="event-team">
                  <q-icon
                    :name="ev.teamId.id === props.teamHome.id ? 'home' : 'flight_takeoff'"
                    :color="ev.teamId.id === props.teamHome.id ? 'green' : 'orange'"
                    size="sm"
                    class="q-mr-xs"
                  />
                  <span class="text-weight-bold">{{ teamName(ev.teamId.id) }}</span>
                </div>
                <q-chip
                  :color="getStatusColor(ev.status)"
                  :text-color="getStatusTextColor()"
                  :icon="getStatusIcon(ev.status)"
                  dense
                  class="event-status"
                >
                  {{ getStatusLabel(ev.status) }}
                </q-chip>
              </div>
            </template>

            <template #subtitle>
              <div class="event-time">
                <q-icon name="schedule" size="xs" class="q-mr-xs" />
                Min {{ ev.minute }}{{ ev.extraTime ? '+' + ev.extraTime : '' }}
              </div>
            </template>

            <div class="event-content">
              <div class="event-details">
                <div class="event-type">
                  <q-icon :name="getEventIcon(ev.type)" class="q-mr-xs" />
                  <span class="text-weight-bold">{{ getEventTypeLabel(ev.type) }}</span>
                </div>
                <div v-if="ev.playerId" class="event-player">
                  <q-icon name="person" size="xs" class="q-mr-xs" />
                  {{ ev.playerId.name }}
                </div>
                <div v-if="ev.meta?.description" class="event-description">
                  <q-icon name="notes" size="xs" class="q-mr-xs" />
                  {{ ev.meta.description }}
                </div>
              </div>

              <div v-if="canEdit" class="event-actions q-mt-sm">
                <q-btn
                  v-if="ev.status !== 'aprobado'"
                  dense
                  flat
                  icon="task_alt"
                  color="positive"
                  @click="$emit('approve', ev.id)"
                  size="sm"
                >
                  <q-tooltip>Aprobar evento</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="ev.status !== 'rechazado'"
                  dense
                  flat
                  icon="block"
                  color="warning"
                  @click="$emit('reject', ev.id)"
                  size="sm"
                >
                  <q-tooltip>Rechazar evento</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  flat
                  icon="delete"
                  color="negative"
                  @click="confirmDelete(ev.id)"
                  size="sm"
                >
                  <q-tooltip>Eliminar evento</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-timeline-entry>
        </q-timeline>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'
import type { Match, MatchEvent } from '@/types/competition'
import { useEventStore } from '@/stores/events'
import { computeScoreFromEvents } from '@/services/eventService'

const props = defineProps<{
  match: Match
  teams: { id: string; name: string }[]
  canEdit: boolean      // admin/manager
  canPropose: boolean   // captain
  teamHome: { id: string; name: string }
  teamAway: { id: string; name: string }
}>()

const emit = defineEmits<{
  (e: 'confirm', score: {home:number;away:number}): void
  (e: 'addEvent'): void
  (e: 'approve', id: string): void
  (e: 'reject', id: string): void
  (e: 'remove', id: string): void
}>()

const $q = useQuasar()
const eStore = useEventStore()
const homeName = computed(() => props.teamHome.name)
const awayName = computed(() => props.teamAway.name)

const home = ref(props.match.score.home)
const away = ref(props.match.score.away)

// Variables para análisis de Veo
const VEO_BASE_URL = 'https://app.veo.co/matches/'
const API_BASE_URL = '/gol360-api'

const veoMatchSlug = ref('')
const generatingAnalysis = ref(false)
const checkingStatus = ref(false)
const analysisJob = ref({
  jobId: '',
  status: '',
  message: ''
})

onMounted(() => eStore.fetch(props.match.id))

const approvedScore = computed(() => computeScoreFromEvents(eStore.items, props.teamHome.id, props.teamAway.id))

// Computed properties para la UI
const hasScoreDiscrepancy = computed(() => {
  return home.value !== approvedScore.value.home || away.value !== approvedScore.value.away
})

const hasValidationErrors = computed(() => {
  return home.value < 0 || away.value < 0
})

const eventSummary = computed(() => {
  const events = eStore.items
  return {
    total: events.length,
    approved: events.filter(e => e.status === 'aprobado').length,
    pending: events.filter(e => e.status === 'propuesto').length,
    rejected: events.filter(e => e.status === 'rechazado').length
  }
})

// Computed para construcción de URL de Veo
const constructedVeoUrl = computed(() => {
  if (!veoMatchSlug.value) return ''
  return `${VEO_BASE_URL}${veoMatchSlug.value}/`
})

function confirmFinal() {
  if (!props.canEdit || hasValidationErrors.value) return

  if (hasScoreDiscrepancy.value) {
    $q.dialog({
      title: 'Confirmar marcador',
      message: `El marcador manual (${home.value} - ${away.value}) no coincide con los eventos aprobados (${approvedScore.value.home} - ${approvedScore.value.away}). ¿Continuar?`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      emit('confirm', { home: Number(home.value), away: Number(away.value) })
    })
  } else {
    emit('confirm', { home: Number(home.value), away: Number(away.value) })
  }
}

function teamName(id: string) {
  return props.teams.find(t => t.id === id)?.name || '—'
}

function confirmDelete(eventId: string) {
  $q.dialog({
    title: 'Eliminar evento',
    message: '¿Estás seguro de que quieres eliminar este evento?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    emit('remove', eventId)
  })
}

// Funciones para el formato de eventos
function getEventIcon(type: string): string {
  switch (type) {
    case 'gol':
    case 'penalti_marcado':
    case 'autogol':
      return 'sports_soccer'
    case 'amarilla':
      return 'square'
    case 'roja':
      return 'stop'
    case 'sub_in':
      return 'arrow_circle_up'
    case 'sub_out':
      return 'arrow_circle_down'
    default:
      return 'info'
  }
}

function getEventColor(event: MatchEvent): string {
  switch (event.status) {
    case 'aprobado':
      return 'positive'
    case 'rechazado':
      return 'negative'
    default:
      return 'warning'
  }
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    gol: 'Gol',
    penalti_marcado: 'Penalti (Gol)',
    penalti_fallado: 'Penalti (Fallado)',
    autogol: 'Autogol',
    amarilla: 'Tarjeta Amarilla',
    roja: 'Tarjeta Roja',
    sub_in: 'Substitución (Entra)',
    sub_out: 'Substitución (Sale)',
    asistencia: 'Asistencia'
  }
  return labels[type] || type
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'aprobado':
      return 'positive'
    case 'rechazado':
      return 'negative'
    default:
      return 'warning'
  }
}

function getStatusTextColor(): string {
  return 'white'
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'aprobado':
      return 'check_circle'
    case 'rechazado':
      return 'cancel'
    default:
      return 'schedule'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'aprobado':
      return 'Aprobado'
    case 'rechazado':
      return 'Rechazado'
    default:
      return 'Pendiente'
  }
}

// Funciones para integración con API de GOL360

async function generateAnalysis() {
  if (!veoMatchSlug.value) return

  generatingAnalysis.value = true

  try {
    const payload = {
      matchUrl: constructedVeoUrl.value,
      tournamentId: props.match.tournamentId,
      matchId: props.match.id,
      homeTeam: props.teamHome.id,
      awayTeam: props.teamAway.id,
      startUrl: "https://app.veo.co/clubs/clubnext-2200914e/recordings/",
      options: {
        priority: "normal",
        timeout: 1800,
        dataTypes: ["stats", "highlights", "player-moments"],
        notify: {
          email: "user@example.com",
          webhook: "https://webhook.example.com"
        }
      }
    }

    const response = await axios.post(`${API_BASE_URL}/api/scrape/match`, payload)

    if (response.data.success) {
      analysisJob.value = {
        jobId: response.data.jobId,
        status: response.data.status,
        message: response.data.message
      }

      $q.notify({
        type: 'positive',
        message: 'Análisis iniciado correctamente',
        caption: 'El procesamiento puede tardar hasta 1 hora',
        position: 'top'
      })
    } else {
      throw new Error('No se pudo iniciar el análisis')
    }

  } catch (error: unknown) {
    console.error('Error generating analysis:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    $q.notify({
      type: 'negative',
      message: 'Error al generar análisis',
      caption: apiMessage || errorMessage,
      position: 'top'
    })
  } finally {
    generatingAnalysis.value = false
  }
}

async function checkAnalysisStatus() {
  if (!analysisJob.value.jobId) return

  checkingStatus.value = true

  try {
    const response = await axios.get(`${API_BASE_URL}/api/scrape/status/${analysisJob.value.jobId}`)

    analysisJob.value = {
      jobId: response.data.jobId,
      status: response.data.status,
      message: getJobStatusMessage(response.data.status)
    }

    $q.notify({
      type: 'info',
      message: `Estado: ${getJobStatusLabel(response.data.status)}`,
      position: 'top'
    })

  } catch (error: unknown) {
    console.error('Error checking status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    $q.notify({
      type: 'negative',
      message: 'Error al verificar estado',
      caption: apiMessage || errorMessage,
      position: 'top'
    })
  } finally {
    checkingStatus.value = false
  }
}

// Funciones auxiliares para estado del job
function getJobStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'positive'
    case 'failed':
      return 'negative'
    case 'running':
      return 'warning'
    case 'pending':
      return 'info'
    default:
      return 'grey'
  }
}

function getJobStatusTextColor(): string {
  return 'white'
}

function getJobStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return 'check_circle'
    case 'failed':
      return 'error'
    case 'running':
      return 'hourglass_empty'
    case 'pending':
      return 'schedule'
    default:
      return 'help'
  }
}

function getJobStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completado'
    case 'failed':
      return 'Error'
    case 'running':
      return 'Procesando'
    case 'pending':
      return 'Pendiente'
    default:
      return 'Desconocido'
  }
}

function getJobStatusMessage(status: string): string {
  switch (status) {
    case 'completed':
      return 'El análisis se completó exitosamente'
    case 'failed':
      return 'Hubo un error durante el procesamiento'
    case 'running':
      return 'El análisis está siendo procesado'
    case 'pending':
      return 'El análisis está en cola'
    default:
      return 'Estado desconocido'
  }
}
</script>

<style scoped lang="scss">
.results-form-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-section {
  padding: 20px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.12);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.text-weight-bold {
  font-weight: 900 !important;
}

// Sección de marcador
.score-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.score-input-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 20px 0;
}

.team-score {
  flex: 1;
  max-width: 200px;
  text-align: center;
}

.team-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--q-primary);
}

.team-name {
  font-size: 0.9rem;
}

.score-input {
  :deep(.q-field__control) {
    height: 80px;
    border-radius: 12px;
  }

  :deep(.q-field__native) {
    font-size: 2rem !important;
    font-weight: 900 !important;
  }
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

.vs-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--q-primary);
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid var(--q-primary);
}

.score-comparison {
  margin: 16px 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

// Sección de análisis
.analysis-section {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  border: 2px solid rgba(33, 150, 243, 0.2);
  max-height: 70vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--q-primary);
    border-radius: 3px;

    &:hover {
      background: var(--q-secondary);
    }
  }
}

.veo-url-section {
  .url-constructor {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    .url-base {
      flex: 0 0 200px;
    }

    .url-slug {
      flex: 1;
    }
  }

  .url-preview {
    .url-code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.85rem;
      word-break: break-all;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 4px;
      display: block;
      margin-top: 4px;
    }
  }
}

.analysis-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.analysis-status,
.analysis-completed,
.analysis-failed {
  .analysis-actions {
    justify-content: flex-start;
  }
}

// Sección de eventos
.events-section {
  background: white;
}

.loading-events {
  .q-card {
    border-radius: 8px;
  }
}

.no-events {
  text-align: center;
  padding: 40px 20px;
  color: #9e9e9e;
}

.events-timeline {
  :deep(.q-timeline) {
    padding: 0;
  }
}

.event-entry {
  :deep(.q-timeline-entry__content) {
    padding-bottom: 24px;
  }
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.event-team {
  display: flex;
  align-items: center;
}

.event-status {
  font-size: 0.75rem;
}

.event-time {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
}

.event-content {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  margin-top: 8px;
}

.event-details {
  margin-bottom: 8px;
}

.event-type {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.event-player,
.event-description {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 2px;
}

.event-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

// Responsive design
@media (max-width: 600px) {
  .results-form-container {
    padding: 0;
  }

  .form-section {
    margin: 12px;
    padding: 16px;
  }

  .score-input-container {
    flex-direction: column;
    gap: 16px;
  }

  .vs-divider {
    height: auto;
    transform: rotate(90deg);
  }

  .vs-text {
    font-size: 1.2rem;
    padding: 6px 12px;
  }

  .team-score {
    max-width: 100%;
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;

    .q-btn {
      margin-bottom: 8px;
    }
  }

  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .event-actions {
    justify-content: center;
  }

  // Responsive para análisis
  .veo-url-section {
    .url-constructor {
      flex-direction: column;
      gap: 16px;

      .url-base {
        flex: none;
      }
    }
  }

  .analysis-actions {
    flex-direction: column;
    align-items: stretch;

    .q-btn {
      margin-bottom: 8px;
    }
  }
}

// Animaciones
.form-section {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.event-content {
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
}

// Estados especiales
.home-team .score-input {
  :deep(.q-field__control) {
    border-left: 4px solid #4caf50;
  }
}

.away-team .score-input {
  :deep(.q-field__control) {
    border-left: 4px solid #ff9800;
  }
}
</style>


