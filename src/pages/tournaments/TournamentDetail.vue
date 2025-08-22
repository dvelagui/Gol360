<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Torneo</div>
        <div class="text-caption text-grey-7">ID: {{ tId }}</div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn v-if="canCreateMatch" color="primary" icon="event" label="Nuevo partido" @click="openMatchCreate" />
        <q-btn flat icon="arrow_back" label="Volver" @click="goBack" />
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs v-model="tab" class="bg-transparent text-primary" active-color="primary" indicator-color="primary"
      align="left" narrow-indicator>
      <q-tab name="schedule" label="Programación" icon="calendar_month" />
      <q-tab name="teams" label="Equipos" icon="groups" />
      <q-tab name="players" label="Jugadores" icon="sports_soccer" />
      <q-tab name="standings" label="Tabla" icon="leaderboard" />
      <q-tab name="leaders" label="Rankings" icon="emoji_events" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="tab" animated swipeable>
      <!-- PROGRAMACIÓN -->
      <q-tab-panel name="schedule" class="q-pa-none">
        <SchedulePanel ref="scheduleRef" :tournament-id="tId" v-if="role" :role="role" @edit="openMatchEdit"
          @results="openResults" />
        <SchedulePanel ref="scheduleRef" :tournament-id="tId" v-else @edit="openMatchEdit" @results="openResults" />
      </q-tab-panel>

      <!-- EQUIPOS -->
      <q-tab-panel name="teams" class="q-pa-none">
        <TeamsPanel ref="teamRef" :tournament-id="tId" v-bind="role !== undefined ? { role } : {}"
          @create-team="openTeamCreate" @edit-team="openTeamEdit" @open-players="openPlayers" />
      </q-tab-panel>

      <!-- JUGADORES -->
      <q-tab-panel name="players" class="q-pa-none">
        <PlayersPanel :tournament-id="tId" v-bind="role !== undefined ? { role } : {}"
          @open-profile="openPlayerProfile" />
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
    <MatchFormDialog v-model="showMatchForm" :tournament-id="tId" :teams="teams" :model-value2="matchModel"
      @saved="afterMatchSaved" />

    <!-- DIALOG: RESULTADOS Y EVENTOS -->
    <ResultsDialog v-model="showResults" :match="resultsMatch" :teams="teams" :can-edit="canEditMatch"
      :can-propose="role === 'team'" @confirm="onConfirm" @addEvent="openEventDialog" @approve="approveEv"
      @reject="rejectEv" @remove="removeEv" />

    <!-- DIALOG: NUEVO EVENTO -->
    <EventDialog v-model="showEvent" :match="resultsMatch" :tournament-id="tId" :teams="teams"
      :can-approve="role === 'admin' || role === 'manager'" @submit="submitEvent" />

    <!-- DIALOGS EQUIPOS/JUGADORES -->
    <TeamFormDialog v-model="showTeamForm" :tournament-id="tId" :model-value2="teamModel" @saved="afterTeamSaved" />
    <PlayersDialog v-model="showPlayers" :tournament-id="tId" :team="currentTeam"
      v-bind="role !== undefined ? { role } : {}" />
    <PlayerProfileDialog v-model="showPlayerProfile" :player-id="selectedPlayerId"
      v-bind="role !== undefined ? { role } : {}" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'

import { useDatabaseStore } from '@/stores/database'
import { listTeamsByTournament } from '@/services/teamService'
import { useEventStore } from '@/stores/events'
import { confirmResult, setMatchScore } from '@/services/matchService'

import type { Match, MatchEvent, MatchPhase } from '@/types/competition'
import type { Team } from '@/types/auth'

/* Lazy components */
const SchedulePanel = defineAsyncComponent(() => import('./TournamentDetail/panels/SchedulePanel.vue'))
const TeamsPanel = defineAsyncComponent(() => import('./TournamentDetail/panels/TeamsPanel.vue'))
const PlayersPanel        = defineAsyncComponent(() => import('./TournamentDetail/panels/PlayersPanel.vue'))
const MatchFormDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/MatchFormDialog.vue'))
const ResultsDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/ResultsDialog.vue'))
const EventDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/EventDialog.vue'))
const TeamFormDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/TeamFormDialog.vue'))
const PlayersDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/PlayersDialog.vue'))
const PlayerProfileDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/PlayerProfileDialog.vue'))


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
  id?: string
}

const route = useRoute()
const router = useRouter()
const tId = route.params.id as string

const tab = ref<'schedule' | 'teams' | 'standings' | 'leaders'>('schedule')

const eStore = useEventStore()
const database = useDatabaseStore()

const role = computed<Role>(() => database.userData?.role)
const canCreateMatch = computed<boolean>(() => role.value === 'admin' || role.value === 'manager')
const canEditMatch = canCreateMatch

const showPlayerProfile = ref(false)
const selectedPlayerId  = ref<string | null>(null)


/* Equipos mínimos para selects/diálogos de partidos */
const teams = ref<TeamMin[]>([])
async function loadTeams(): Promise<void> {
  try {
    const list = await listTeamsByTournament(tId)
    teams.value = list.map(t => ({ id: t.id, name: t.displayName }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos'
    Notify.create({ type: 'negative', message: msg })
  }
}

/* Refs a paneles para refrescar */
const scheduleRef = ref<{ refetch: () => Promise<void> } | null>(null)
const teamRef = ref<{ refetch: () => Promise<void> } | null>(null)

/* Diálogos Partidos */
const showMatchForm = ref(false)
const matchModel = ref<MatchFormModel | null>(null)
const showResults = ref(false)
const resultsMatch = ref<Match | null>(null)
const showEvent = ref(false)

/* Diálogos Equipos/Jugadores */
const showTeamForm = ref(false)
const teamModel = ref<Partial<Team> | null>(null)
const showPlayers = ref(false)
const currentTeam = ref<Team | null>(null)

/* Header actions (partidos) */
function openMatchCreate() {
  matchModel.value = null
  showMatchForm.value = true
}
function openMatchEdit(m: Match) {
  matchModel.value = {
    tournamentId: m.tournamentId,
    round: String(m.round),
    phase: m.phase,
    dateISO: new Date(m.date).toISOString().slice(0, 16),
    homeTeamId: typeof m.homeTeamId === 'object' && m.homeTeamId !== null ? m.homeTeamId.id : m.homeTeamId,
    awayTeamId: typeof m.awayTeamId === 'object' && m.awayTeamId !== null ? m.awayTeamId.id : m.awayTeamId,
    ...(m.field ? { field: m.field } : {}),
    ...(m.referee ? { referee: m.referee } : {}),
    ...(m.notes ? { notes: m.notes } : {}),
    id: m.id
  }
  showMatchForm.value = true
}
function openResults(m: Match) {
  resultsMatch.value = m
  showResults.value = true
}
function openEventDialog() { showEvent.value = true }

/* Actions Equipos/Jugadores */
function openTeamCreate() {
  teamModel.value = null
  showTeamForm.value = true
}
function openTeamEdit(t: Team) {
  teamModel.value = { ...t }
  showTeamForm.value = true
}
function openPlayers(t: Team) {
  currentTeam.value = t
  showPlayers.value = true
}
function openPlayerProfile(id: string) {
  selectedPlayerId.value = id
  showPlayerProfile.value = true
}


/* Callbacks post‑save */
async function afterMatchSaved() {
  showMatchForm.value = false
  await scheduleRef.value?.refetch()
}
async function afterTeamSaved() {
  showTeamForm.value = false
  await teamRef.value?.refetch()
  await loadTeams() // mantener sincronizado el selector de partidos
}

/* Confirmar marcador final */
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

/* Envío de evento */
async function submitEvent(
  payload: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'proposed' | 'approved' }
): Promise<void> {
  try {
    const base: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> = {
      matchId: payload.matchId,
      tournamentId: payload.tournamentId,
      teamId: payload.teamId,
      ...(payload.playerId
        ? {
          playerId:
            typeof payload.playerId === 'object'
              ? payload.playerId
              : { id: payload.playerId, name: '' }
        }
        : {}),
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

function goBack() { router.back() }

onMounted(async () => {
  await loadTeams()
})
</script>

<style scoped lang="scss">
.rounded-borders {
  border-radius: 12px;
}
</style>
