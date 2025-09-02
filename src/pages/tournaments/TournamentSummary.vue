<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">{{ tName }}</div>
        <div class="text-caption text-grey-7">ID: {{ tId }}</div>
      </div>
    </div>
    <div class="row items-center q-col-gutter-md q-mb-md">

      <div class="col-12 col-md-3">
        <q-select
          v-model="tId"
          :options="tournaments"
          :option-label="tournaments => tournaments.displayName"
          :option-value="tournaments => tournaments.tournamentId"
          dense
          filled
          clearable
          label="Seleccione el campeonato"
          emit-value
          map-options
        />
      </div>
    </div>
    <q-tabs v-model="tab" class="bg-transparent text-secondary" active-color="primary" indicator-color="primary"
      align="left" narrow-indicator>
      <q-tab name="schedule" label="Programación" icon="calendar_month" />
      <q-tab name="standings" label="Tabla" icon="leaderboard" />
      <q-tab name="leaders" label="Rankings" icon="emoji_events" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="tab" animated swipeable>
      <q-tab-panel name="schedule" class="q-pa-none">
        <div class="row q-gutter-sm justify-end">
          <q-btn v-if="canCreateMatch" color="accent" text-color="secondary" icon="event" label="Nuevo partido"
            @click="openMatchCreate" />
        </div>
        <SchedulePanel ref="scheduleRef" :tournament-id="tId" v-if="role" :role="role" @edit="openMatchEdit"
          @results="openResults" />
        <SchedulePanel ref="scheduleRef" :tournament-id="tId" v-else @edit="openMatchEdit" @results="openResults" />
      </q-tab-panel>
      <q-tab-panel name="standings" class="q-pa-none">
        <StandingsPanel :tournament-id="tId" />
      </q-tab-panel>
      <q-tab-panel name="leaders" class="q-pa-none">
        <RankingsPanel :tournament-id="tId" />
      </q-tab-panel>
    </q-tab-panels>

    <MatchFormDialog v-model="showMatchForm" :tournament-id="tId" :teams="teams" :model-value2="matchModel"
      @saved="afterMatchSaved" />

    <ResultsDialog v-model="showResults" :match="resultsMatch" :teams="teams" :can-edit="canEditMatch"
      :can-propose="role === 'team'" @confirm="onConfirm" @addEvent="openEventDialog" @approve="approveEv"
      @reject="rejectEv" @remove="removeEv" />

    <EventDialog v-model="showEvent" :match="resultsMatch" :tournament-id="tId" :teams="teams"
      :can-approve="role === 'admin' || role === 'manager'" @submit="submitEvent" />


  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { Notify } from 'quasar'
import { useDatabaseStore } from '@/stores/database'
import { useTournamentStore } from '@/stores/tournaments'
import { useUserStore } from '@/stores/user'
import { listTeamsByTournament } from '@/services/teamService'
import { useEventStore } from '@/stores/events'
import { confirmResult, setMatchScore } from '@/services/matchService'
import type { Match, MatchEvent, MatchPhase } from '@/types/competition'
import type { Tournament } from '@/types/auth'

/* Lazy components */
const SchedulePanel = defineAsyncComponent(() => import('./TournamentDetail/panels/SchedulePanel.vue'))
const StandingsPanel = defineAsyncComponent(() => import('./TournamentDetail/panels/StandingsPanel.vue'))
const RankingsPanel = defineAsyncComponent(() => import('./TournamentDetail/panels/RankingsPanel.vue'))
const MatchFormDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/MatchFormDialog.vue'))
const ResultsDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/ResultsDialog.vue'))
const EventDialog = defineAsyncComponent(() => import('./TournamentDetail/dialogs/EventDialog.vue'))


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

const tStore = useTournamentStore()
const eStore = useEventStore()
const uStore = useUserStore()
const database = useDatabaseStore()

const tournaments = ref<Tournament[]>([])
const tId = ref<string>('')
const tab = ref<'schedule' | 'teams' | 'players' | 'standings' | 'leaders'>('schedule')

const role = computed<Role>(() => database.userData?.role)
async function fetchByRole() {
  if (!role.value) return
  // admin ve todos; manager solo los suyos
  if (role.value === 'manager') {
    console.log(uStore.user?.uid);

    await tStore.fetch(uStore.user?.uid || '')
    tournaments.value = tStore.items
  } else if ((role.value === 'player')) {
    await tStore.fetch(uStore.user?.uid || '')
    tournaments.value = tStore.items
  } else {
    await tStore.fetch()
    tournaments.value = tStore.items
  }
}
const tName = computed(() => tStore.item?.displayName || '')


const canCreateMatch = computed<boolean>(() => role.value === 'admin' || role.value === 'manager')
const canEditMatch = canCreateMatch



/* Equipos mínimos para selects/diálogos de partidos */
const teams = ref<TeamMin[]>([])
async function loadTeams(): Promise<void> {
  try {
    const list = await listTeamsByTournament(tId.value)
    teams.value = list.map(t => ({ id: t.id, name: t.displayName }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos'
    Notify.create({ type: 'negative', message: msg })
  }
}

//funcion para traer doc con tournamentId usando fetchById de store
async function fetchTournament(tournamentId?: string) {
  if (!tournamentId) return
  await tStore.fetchById(tournamentId)
}

/* Refs a paneles para refrescar */
const scheduleRef = ref<{ refetch: () => Promise<void> } | null>(null)

/* Diálogos Partidos */
const showMatchForm = ref(false)
const matchModel = ref<MatchFormModel | null>(null)
const showResults = ref(false)
const resultsMatch = ref<Match | null>(null)
const showEvent = ref(false)


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




/* Callbacks post‑save */
async function afterMatchSaved() {
  showMatchForm.value = false
  await scheduleRef.value?.refetch()
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


onMounted(async () => {
  void fetchByRole()
  await fetchTournament(tId.value)
  watch(role, fetchByRole)
  watch(tId, loadTeams)
})
</script>

<style scoped lang="scss">
.rounded-borders {
  border-radius: 12px;
}
</style>
