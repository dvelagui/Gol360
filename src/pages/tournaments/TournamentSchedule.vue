<template>
  <q-page class="tournament-schedule-page">
     <div class="text-center q-my-lg">
        <div class="sports-font text-h4">La jornada <q-icon name="sports" /></div>
      </div>

    <div class="tournament-selector-wrapper">
      <q-card class="tournament-selector-card">
        <q-card-section class="q-pa-xs">
          <div v-if="selectedTournament && !showSelector" class="tournament-compact">
            <div class="tournament-info">
              <q-icon name="emoji_events" color="primary" />
              <div class="tournament-details">
                <div class="text-h5 text-weight-bold">{{ selectedTournament.displayName }}</div>
                <div class="text-caption text-grey-6">{{ selectedTournament.season }} • {{ selectedTournament.city }}</div>
              </div>
            </div>
            <q-btn
              outline
              dense
              color="primary"
              label="Cambiar"
              icon-right="sync_alt"
              @click="showSelector = true"
              class="change-btn"
            />
          </div>
          <q-select
            v-else
            v-model="selectedTournament"
            :options="tournaments"
            option-label="displayName"
            filled
            label="Seleccione el campeonato"
            @update:model-value="onTournamentChange"
            class="tournament-select"
            :loading="isLoading"
            autofocus
          >
            <template #prepend>
              <q-icon name="emoji_events" color="primary" size="28px" />
            </template>
            <template #selected>
              <div v-if="selectedTournament" class="selected-tournament">
                <div class="text-weight-bold text-h6">{{ selectedTournament.displayName }}</div>
                <div class="text-caption text-grey-6">{{ selectedTournament.season }} • {{ selectedTournament.city }}</div>
              </div>
            </template>
          </q-select>
        </q-card-section>
      </q-card>
    </div>

    <q-card class="tabs-card">
      <q-tabs
        v-model="tab"
        class="modern-tabs"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        :breakpoint="0"
      >
        <q-tab name="schedule" class="modern-tab">
          <div class="tab-content">
            <q-icon name="calendar_month" size="24px" />
            <span v-if="$q.screen.gt.xs">Programación</span>
          </div>
        </q-tab>
        <q-tab name="standings" class="modern-tab">
          <div class="tab-content">
            <q-icon name="leaderboard" size="24px" />
            <span v-if="$q.screen.gt.xs">Tabla</span>
          </div>
        </q-tab>
        <q-tab name="leaders" class="modern-tab">
          <div class="tab-content">
            <q-icon name="emoji_events" size="24px" />
            <span v-if="$q.screen.gt.xs">Rankings</span>
          </div>
        </q-tab>
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="schedule" class="q-pa-none">
        <div v-if="canCreateMatch" class="row q-gutter-sm justify-end q-mb-md">
          <q-btn color="accent" text-color="secondary" icon="event" label="Nuevo partido"
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
import { Notify, useQuasar } from 'quasar'
import { useDatabaseStore } from '@/stores/database'
import { useTournamentStore } from '@/stores/tournaments'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/players'
import { useEventStore } from '@/stores/events'
import { useTournamentSelection } from '@/composables/useTournamentSelection'
import { listTeamsByTournament } from '@/services/teamService'
import { confirmResult, setMatchScore } from '@/services/matchService'
import type { Match, MatchEvent, MatchPhase } from '@/types/competition'
import type { Tournament } from '@/types/auth'

const $q = useQuasar()

/* Lazy components */
const SchedulePanel = defineAsyncComponent(() => import('@/components/tournaments/panels/SchedulePanel.vue'))
const StandingsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/StandingsPanel.vue'))
const RankingsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/RankingsPanel.vue'))
const MatchFormDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/MatchFormDialog.vue'))
const ResultsDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/ResultsDialog.vue'))
const EventDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/EventDialog.vue'))


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
const pStore = usePlayerStore()
const database = useDatabaseStore()

const tournaments = ref<Tournament[]>([])
const tab = ref<'schedule' | 'teams' | 'players' | 'standings' | 'leaders'>('schedule')

// Usar composable para persistencia del torneo seleccionado
const { selectedTournament, updateSelection } = useTournamentSelection(tournaments)

// Computed para el ID del torneo seleccionado
const tId = computed<string>(() => selectedTournament.value?.tournamentId || '')

const role = computed<Role>(() => database.userData?.role)
const isLoading = ref(false)

// Control para mostrar/ocultar el selector
const showSelector = ref(false)

// Función para manejar el cambio de torneo
function onTournamentChange(tournament: Tournament | null) {
  if (tournament) {
    updateSelection(tournament)
    showSelector.value = false
  }
}

async function fetchByRole() {
  const currentRole = role.value;
  if (!currentRole || isLoading.value) return;

  isLoading.value = true;
  try {
    switch (currentRole) {
      case 'manager':
        await tStore.fetch(uStore.user?.uid || '');
        tournaments.value = tStore.items;
        break;
      case 'player':
        await tStore.fetch();
        // Obtener torneos usando el nuevo sistema de participaciones
        if (uStore.user?.email) {
          const player = await pStore.findByEmail(uStore.user.email);
          if (player) {
            const tournamentIds = await pStore.getPlayerTournaments(player.id);
            tournaments.value = tStore.items.filter(t =>
              tournamentIds.includes(t.tournamentId)
            );
          } else {
            tournaments.value = [];
          }
        } else {
          tournaments.value = [];
        }
        break;
      case 'admin':
      case 'team':
      default:
        await tStore.fetch();
        tournaments.value = tStore.items;
        break;
    }
  } finally {
    isLoading.value = false;
  }
}


const canCreateMatch = computed<boolean>(() => {
  const userRole = role.value;
  return userRole === 'admin' || userRole === 'manager';
});
const canEditMatch = canCreateMatch



/* Equipos mínimos para selects/diálogos de partidos */
const teams = ref<TeamMin[]>([])
const teamsLoading = ref(false)

async function loadTeams(): Promise<void> {
  if (!tId.value || teamsLoading.value) return;

  teamsLoading.value = true;
  try {
    const list = await listTeamsByTournament(tId.value);
    teams.value = list.map(t => ({ id: t.id, name: t.displayName }));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos';
    Notify.create({ type: 'negative', message: msg });
  } finally {
    teamsLoading.value = false;
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
  payload: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'propuesto' | 'aprobado' }
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
  await fetchByRole();
  await fetchTournament(tId.value);

  // Mostrar selector si no hay torneo seleccionado
  if (!selectedTournament.value) {
    showSelector.value = true
  }

  // Watch role changes and refetch tournaments accordingly
  watch(role, async (newRole, oldRole) => {
    if (newRole !== oldRole && newRole) {
      await fetchByRole();
    }
  }, { immediate: false });

  // Watch tournament ID changes and load teams
  watch(tId, async (newTId, oldTId) => {
    if (newTId !== oldTId) {
      await fetchTournament(newTId);
      await loadTeams();
    }
  }, { immediate: false });
})
</script>

<style scoped lang="scss">

.sports-font {
  font-family: 'Arial Black', Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #f2c526;
  -webkit-text-stroke: 2px #013f21;
  text-shadow: 0px 0px 10px #218e61;
  padding: 2px 8px;
  border-radius: 10px;
  background: linear-gradient(135deg, #064F34, #138A59);
}

.rounded-borders {
  border-radius: 12px;
}

.ad-banner img {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  width: 100%;
  max-width: 80%;
  max-height: 150px;
}

.tournament-schedule-page {
  background: #F5F7FA;
  min-height: 100vh;
}

// Hero Header
.page-hero {
  background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
  padding: 40px 24px;
  margin: -16px -16px 24px -16px;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
  margin-bottom: 8px;

  h1 {
    font-family: 'Arial Black', Impact, sans-serif;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }
}

.hero-icon {
  color: #F2C526;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  padding-left: 58px;
}

// Tournament Selector Card
.tournament-selector-wrapper {
  max-width: 800px;
  margin: 16px 0;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.tournament-selector-card {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 2px solid #E0E0E0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  // Estilo compacto cuando está seleccionado
  &:has(.tournament-compact) {
    max-width: 600px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #E0E0E0;

    .q-card-section {
      padding: 12px 16px !important;
    }

    &:hover {
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }
  }
}

.tournament-select {
  :deep(.q-field__control) {
    border-radius: 12px;
    min-height: 70px;
  }

  :deep(.q-field__label) {
    font-size: 1rem;
    font-weight: 600;
  }

  :deep(.q-field__prepend) {
    padding-right: 16px;
  }
}

.selected-tournament {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

// Modo compacto
.tournament-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  animation: fadeIn 0.3s ease;
}

.tournament-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 12px;
}

.tournament-details {
  flex: 1;
  min-width: 0;

  .text-h5 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #064F34;
    font-size: 1.1rem;
    margin: 0;
  }

  .text-caption {
    font-size: 0.75rem;
  }
}

.tournament-info .q-icon {
  font-size: 24px !important;
}

.change-btn {
  flex-shrink: 0;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 6px 16px;
  transition: all 0.2s ease;

  :deep(.q-icon) {
    font-size: 16px;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 2px 8px rgba(6, 79, 52, 0.15);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Tabs Card
.tabs-card {
  max-width: 1200px;
  margin: 0 auto 24px auto;
  margin-left: 16px;
  margin-right: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.modern-tabs {
  background: white;
}

.modern-tabs :deep(.q-tab) {
  padding: 16px 24px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(6, 79, 52, 0.05);
  }
}

.modern-tabs :deep(.q-tab--active) {
  background: linear-gradient(135deg, rgba(6, 79, 52, 0.1), rgba(19, 138, 89, 0.1));
}

.modern-tabs :deep(.q-tabs__indicator) {
  height: 3px;
  border-radius: 3px 3px 0 0;
}

.modern-tab {
  .tab-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.85rem;
  }
}

// Tab Panels
:deep(.q-tab-panels) {
  background: transparent;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

:deep(.q-tab-panel) {
  padding: 0;
}

// Responsive
@media (max-width: 768px) {
  .page-hero {
    padding: 24px 16px;
    margin: -16px -16px 16px -16px;
    border-radius: 0 0 16px 16px;
  }

  .hero-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    h1 {
      font-size: 1.75rem;
    }
  }

  .hero-subtitle {
    padding-left: 0;
    font-size: 0.9rem;
  }

  .tournament-selector-card {
    .q-card-section {
      padding: 16px !important;
    }
  }

  .tournament-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .tournament-info {
    width: 100%;
  }

  .change-btn {
    width: 100%;
  }

  .tournament-stats {
    margin-top: 16px;
    justify-content: space-between;
  }

  .stat-item {
    padding: 4px 8px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .modern-tab {
    .tab-content {
      font-size: 0.75rem;
    }
  }
}
</style>
