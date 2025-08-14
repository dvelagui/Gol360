<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Torneo</div>
        <div class="text-caption text-grey-7">ID: {{ tId }}</div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          v-if="canCreateMatch"
          color="primary"
          icon="event"
          label="Nuevo partido"
          @click="openMatchCreate"
        />
        <q-btn flat icon="arrow_back" label="Volver" @click="goBack" />
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="tab"
      class="bg-transparent text-primary"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="schedule" label="Programación" icon="calendar_month" />
      <q-tab name="standings" label="Tabla" icon="leaderboard" />
      <q-tab name="leaders" label="Rankings" icon="emoji_events" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="tab" animated swipeable>
      <!-- PROGRAMACIÓN -->
      <q-tab-panel name="schedule" class="q-pa-none">
        <SchedulePanel
          ref="scheduleRef"
          :tournament-id="tId"
          :role="role ?? 'team'"
          @edit="openMatchEdit"
          @results="openResults"
        />
      </q-tab-panel>

      <!-- TABLA - placeholder -->
      <q-tab-panel name="standings" class="q-pa-none">
        <div class="q-pa-md bg-grey-1 rounded-borders">
          <div class="text-subtitle1 q-mb-sm">Tabla de posiciones</div>
          <div class="text-caption q-mb-md">
            Próximo: StandingsBoard (tarjetas) + toggle a StandingsTable.
          </div>
          <q-banner class="bg-grey-2 text-grey-8">
            Módulo en construcción. Aquí mostraremos puntos, PJ, DG, GF, GC por equipo.
          </q-banner>
        </div>
      </q-tab-panel>

      <!-- RANKINGS - placeholder -->
      <q-tab-panel name="leaders" class="q-pa-none">
        <div class="q-pa-md bg-grey-1 rounded-borders">
          <div class="text-subtitle1 q-mb-sm">Rankings</div>
          <div class="text-caption q-mb-md">
            Próximo: carruseles de Goleadores, Valla menos vencida, Disciplina, etc.
          </div>
          <q-banner class="bg-grey-2 text-grey-8">
            Módulo en construcción. Mostraremos top scorers y mejores defensas.
          </q-banner>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- DIALOG: CREAR/EDITAR PARTIDO -->
    <MatchFormDialog
      v-model="showMatchForm"
      :tournament-id="tId"
      :teams="teams"
      :model-value2="matchModel"
      @saved="afterMatchSaved"
    />

    <!-- DIALOG: RESULTADOS Y EVENTOS -->
    <ResultsDialog
      v-model="showResults"
      :match="resultsMatch"
      :teams="teams"
      :can-edit="canEditMatch"
      :can-propose="role === 'team'"
      @confirm="onConfirm"
      @addEvent="openEventDialog"
      @approve="approveEv"
      @reject="rejectEv"
      @remove="removeEv"
    />

    <!-- DIALOG: NUEVO EVENTO -->
    <EventDialog
      v-model="showEvent"
      :match="resultsMatch"
      :tournament-id="tId"
      :teams="teams"
      :can-approve="role === 'admin' || role === 'manager'"
      @submit="submitEvent"
    />
  </q-page>
</template>

<script setup lang="ts">
// Padre “ligero”: maneja solo tabs, carga de equipos para diálogos y coordinación.
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { defineAsyncComponent } from 'vue'

import { useDatabaseStore } from '@/stores/database'
import { listTeamsByTournament } from '@/services/teamService'
import { useEventStore } from '@/stores/events'
import { confirmResult, setMatchScore } from '@/services/matchService'

import type { Match, MatchEvent, MatchPhase } from '@/types/competition'

// Lazy components
const SchedulePanel  = defineAsyncComponent(() => import('./TournamentDetail/panels/SchedulePanel.vue'))
const MatchFormDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/MatchFormDialog.vue'))
const ResultsDialog   = defineAsyncComponent(() => import('./TournamentDetail/dialogs/ResultsDialog.vue'))
const EventDialog     = defineAsyncComponent(() => import('./TournamentDetail/dialogs/EventDialog.vue'))

type Role = 'admin' | 'manager' | 'team' | 'player' | undefined
interface TeamMin { id: string; name: string }
interface MatchFormModel {
  tournamentId: string
  round: string
  phase: MatchPhase
  dateISO: string
  field?: string
  referee?: string
  homeTeamId: string
  awayTeamId: string
  notes?: string
}

const route = useRoute()
const router = useRouter()
const tId = route.params.id as string

const tab = ref<'schedule'|'standings'|'leaders'>('schedule')

// Stores usados por callbacks de diálogos
const eStore = useEventStore()
const database = useDatabaseStore()

// permisos
const role = computed<Role>(() => database.userData?.role)
const canCreateMatch = computed<boolean>(() => role.value === 'admin' || role.value === 'manager')
const canEditMatch   = canCreateMatch

// equipos (para diálogos)
const teams = ref<TeamMin[]>([])
async function loadTeams (): Promise<void> {
  try {
    const list = await listTeamsByTournament(tId)
    teams.value = list.map(t => ({ id: t.id, name: t.displayName }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos'
    Notify.create({ type: 'negative', message: msg })
  }
}

// PANEL ref (para pedir refetch tras guardar/confirmar)
const scheduleRef = ref<{ refetch: () => Promise<void> } | null>(null)

// Diálogos y modelos
const showMatchForm = ref(false)
const matchModel    = ref<MatchFormModel | null>(null)

const showResults   = ref(false)
const resultsMatch  = ref<Match | null>(null)

const showEvent     = ref(false)

// Header actions
function openMatchCreate() {
  matchModel.value = null
  showMatchForm.value = true
}
function openMatchEdit(m: Match) {
  // NOTE: trasladamos conversión/normalización al diálogo; aquí solo pasamos el Match crudo.
  matchModel.value = {
    tournamentId: m.tournamentId,
    round: String(m.round),
    phase: m.phase,
    dateISO: new Date(m.date).toISOString().slice(0, 16),
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    ...(m.field ?   { field: m.field } : {}),
    ...(m.referee ? { referee: m.referee } : {}),
    ...(m.notes ?   { notes: m.notes } : {})
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(matchModel.value as any).id = m.id // para que el diálogo sepa si es edición
  showMatchForm.value = true
}
function openResults(m: Match) {
  resultsMatch.value = m
  showResults.value = true
}
function openEventDialog() {
  showEvent.value = true
}

function goBack() {
  router.back()
}

// Diálogo: post-guardado de partido
async function afterMatchSaved() {
  showMatchForm.value = false
  await scheduleRef.value?.refetch()
}

// Confirmar marcador final (igual que en tu componente original)
async function onConfirm(score: { home: number; away: number }): Promise<void> {
  if (!resultsMatch.value) return
  const by: 'admin' | 'manager' = role.value === 'admin' ? 'admin' : 'manager'
  try {
    await setMatchScore(resultsMatch.value.id, score)
    await confirmResult(resultsMatch.value.id, by, score)
    await scheduleRef.value?.refetch()
    Notify.create({ type: 'positive', message: 'Marcador confirmado' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo confirmar'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    showResults.value = false
  }
}

// Envío de evento (igual, con saneo de opcionales)
async function submitEvent(
  payload: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'proposed' | 'approved' }
): Promise<void> {
  try {
    const base: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> = {
      matchId: payload.matchId,
      tournamentId: payload.tournamentId,
      teamId: payload.teamId,
      playerId: payload.playerId ?? null,
      type: payload.type,
      minute: typeof payload.minute === 'number' ? payload.minute : 0,
      createdBy: payload.createdBy
    }
    const normalized = {
      ...base,
      ...(payload.extraTime !== undefined ? { extraTime: payload.extraTime } : {}),
      ...(payload.meta !== undefined ? { meta: payload.meta } : {}),
      ...(payload.status ? { status: payload.status } : {})
    }
    await eStore.create(normalized)
    Notify.create({ type: 'positive', message: 'Evento agregado' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo agregar evento'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    showEvent.value = false
  }
}

async function approveEv(id: string): Promise<void> {
  if (!resultsMatch.value) return
  await eStore.approve(id, resultsMatch.value.id)
}
async function rejectEv(id: string): Promise<void> {
  if (!resultsMatch.value) return
  await eStore.reject(id, resultsMatch.value.id)
}
async function removeEv(id: string): Promise<void> {
  if (!resultsMatch.value) return
  await eStore.remove(id, resultsMatch.value.id)
}

// bootstrap
onMounted(async () => {
  await loadTeams()
})
</script>

<style scoped lang="scss">
.rounded-borders { border-radius: 12px; }
</style>
