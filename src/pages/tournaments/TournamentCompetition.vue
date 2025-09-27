<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">{{ tName }}</div>
        <div class="text-caption text-grey-7">ID: {{ tId }}</div>
      </div>
    </div>
    <q-tabs v-model="tab" class="bg-transparent text-secondary" active-color="primary" indicator-color="primary"
      align="left" narrow-indicator>
      <q-tab name="tournament" label="Torneo" icon="shield" />
      <q-tab name="teams" label="Equipos" icon="groups" />
      <q-tab name="players" label="Jugadores" icon="sports_soccer" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="tab" animated swipeable>
      <q-tab-panel name="tournament" class="q-pa-none">
        <SchedulePanel ref="scheduleRef" :tournament-id="tId" v-if="role" :role="role" @edit="openMatchEdit"
          @results="openResults" />
        <SchedulePanel ref="scheduleRef" :tournament-id="tId" v-else @edit="openMatchEdit" @results="openResults" />
      </q-tab-panel>
      <q-tab-panel name="teams" class="q-pa-none">
        <TeamsPanel ref="teamRef" :tournament-id="tId" :tournament-detail="tStore.item!" v-bind="role !== undefined ? { role } : {}"
          @create-team="openTeamCreate" @edit-team="openTeamEdit" @open-players="openPlayers" />
      </q-tab-panel>
      <q-tab-panel name="players" class="q-pa-none">
        <PlayersPanel :tournament-id="tId" v-bind="role !== undefined ? { role } : {}"
          @open-profile="openPlayerProfile" @add-players="addPlayers" :team-selected="currentTeam" />
      </q-tab-panel>
    </q-tab-panels>

    <TeamFormDialog v-model="showTeamForm" :tournament-id="tId" :model-value2="teamModel" @saved="afterTeamSaved" />
    <PlayersDialog v-model="showPlayers" :tournament-id="tId" :team="currentTeam"
      v-bind="role !== undefined ? { role } : {}" />
    <PlayerProfileDialog v-model="showPlayerProfile" :player-id="selectedPlayerId"
      v-bind="role !== undefined ? { role } : {}" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { Notify } from 'quasar'
import { useDatabaseStore } from '@/stores/database'
import { useTournamentStore } from '@/stores/tournaments'
import { listTeamsByTournament } from '@/services/teamService'

import type { Match, MatchPhase } from '@/types/competition'
import type { Team } from '@/types/auth'

/* Lazy components */
const SchedulePanel = defineAsyncComponent(() => import('@/components/tournaments/panels/SchedulePanel.vue'))
const TeamsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/TeamsPanel.vue'))
const PlayersPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/PlayersPanel.vue'))
const TeamFormDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/TeamFormDialog.vue'))
const PlayersDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/PlayersDialog.vue'))
const PlayerProfileDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/PlayerProfileDialog.vue'))


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
const database = useDatabaseStore()
const route = useRoute()

const tId = route.params.id as string
const tName = computed(() => tStore.item?.displayName || '')
const tab = ref<'schedule' | 'teams' | 'players' | 'standings' | 'leaders'>('schedule')

const role = computed<Role>(() => database.userData?.role)

const showPlayerProfile = ref(false)
const selectedPlayerId = ref<string | null>(null)


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

//funcion para traer doc con tournamentId usando fetchById de store
async function fetchTournament(tournamentId?: string) {
  if (!tournamentId) return
  await tStore.fetchById(tournamentId)
}

/* Refs a paneles para refrescar */
const scheduleRef = ref<{ refetch: () => Promise<void> } | null>(null)
const teamRef = ref<{ refetch: () => Promise<void> } | null>(null)

/* Diálogos Partidos */
const showMatchForm = ref(false)
const matchModel = ref<MatchFormModel | null>(null)
const showResults = ref(false)
const resultsMatch = ref<Match | null>(null)

/* Diálogos Equipos/Jugadores */
const showTeamForm = ref(false)
const teamModel = ref<Partial<Team> | null>(null)
const showPlayers = ref(false)
const currentTeam = ref<Team | null>(null)

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
  tab.value = 'players'
}

function addPlayers(t: Team) {
  currentTeam.value = t
  showPlayers.value = true
}
function openPlayerProfile(id: string) {
  selectedPlayerId.value = id
  showPlayerProfile.value = true
  console.log(id);

}


async function afterTeamSaved() {
  showTeamForm.value = false
  await teamRef.value?.refetch()
  await loadTeams() // mantener sincronizado el selector de partidos
}




onMounted(async () => {
  await loadTeams()
  await fetchTournament(tId)
})
</script>

<style scoped lang="scss">
.rounded-borders {
  border-radius: 12px;
}
</style>
