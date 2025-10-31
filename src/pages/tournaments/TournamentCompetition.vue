<template>
  <q-page class="tournament-competition-page">
    <div class="text-center q-my-lg">
        <div class="sports-font text-h4">El camerino <q-icon name="sports_soccer" /></div>
      </div>

    <div class="tournament-selector-wrapper">
      <q-card class="tournament-selector-card">
        <q-card-section class="q-pa-xs">
          <div v-if="selectedTournament && !showSelector" class="tournament-compact">
            <div class="tournament-info">
              <q-icon name="emoji_events" color="primary" size="32px" class="q-mr-md" />
              <div class="tournament-details">
                <div class="text-h5 text-weight-bold">{{ selectedTournament.displayName }}</div>
                <div class="text-caption text-grey-6">{{ selectedTournament.season }} • {{ selectedTournament.city }}</div>
              </div>
            </div>
            <q-btn
              outline
              color="primary"
              label="Cambiar"
              icon="sync_alt"
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
        <q-tab name="tournament" class="modern-tab">
          <div class="tab-content">
            <q-icon name="shield" size="24px" />
            <span v-if="$q.screen.gt.xs">Torneo</span>
          </div>
        </q-tab>
        <q-tab name="teams" class="modern-tab">
          <div class="tab-content">
            <q-icon name="groups" size="24px" />
            <span v-if="$q.screen.gt.xs">Equipos</span>
          </div>
        </q-tab>
        <q-tab name="players" class="modern-tab">
          <div class="tab-content">
            <q-icon name="sports_soccer" size="24px" />
            <span v-if="$q.screen.gt.xs">Jugadores</span>
          </div>
        </q-tab>
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated swipeable>
      <q-tab-panel name="tournament" class="q-pa-none">
        <TournamentInfoPanel
          :tournament="tStore.item"
          :registered-teams="teamStore.items.length"
          :is-loading="tStore.loading || teamStore.loading"
        />
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
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { Notify, useQuasar } from 'quasar'
import { useDatabaseStore } from '@/stores/database'
import { useTournamentStore } from '@/stores/tournaments'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/players'
import { useTeamStore } from '@/stores/teams'
import { useTournamentSelection } from '@/composables/useTournamentSelection'
import { listTeamsByTournament } from '@/services/teamService'
import type { Tournament } from '@/types/auth'
import type { Team } from '@/types/auth'

const $q = useQuasar()

/* Lazy components */
const TournamentInfoPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/TournamentInfoPanel.vue'))
const TeamsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/TeamsPanel.vue'))
const PlayersPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/PlayersPanel.vue'))
const TeamFormDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/TeamFormDialog.vue'))
const PlayersDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/PlayersDialog.vue'))
const PlayerProfileDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/PlayerProfileDialog.vue'))


type Role = 'admin' | 'manager' | 'team' | 'player' | 'coach' | undefined
interface TeamMin { id: string; name: string }

const tStore = useTournamentStore()
const uStore = useUserStore()
const pStore = usePlayerStore()
const database = useDatabaseStore()
const teamStore = useTeamStore()

const tournaments = ref<Tournament[]>([])
const tab = ref<'tournament' | 'teams' | 'players'>('tournament')

// Usar composable para persistencia del torneo seleccionado
const { selectedTournament, updateSelection } = useTournamentSelection(tournaments)

// Computed para el ID del torneo seleccionado
const tId = computed<string>(() => selectedTournament.value?.tournamentId || '')

// Computed para obtener el rol desde playerParticipations en lugar de users/
const role = computed<Role>(() => {
  // Si es admin o manager, usar el rol de userData (estos sí están en users/)
  const baseRole = database.userData?.role
  if (baseRole === 'admin' || baseRole === 'manager') {
    console.log('👤 [TournamentCompetition] Role desde users/:', baseRole)
    return baseRole
  }

  // Para player, team y coach, buscar en las participaciones del torneo actual
  if (uStore.user?.uid && tId.value) {
    // Buscar la participación del usuario en el torneo actual
    // pStore.items contiene jugadores con sus participaciones anidadas
    const userPlayer = pStore.items.find(p =>
      p.id === uStore.user?.uid && p.tournamentId === tId.value
    )

    console.log('🔍 [TournamentCompetition] Buscando participación:', {
      userId: uStore.user?.uid,
      tournamentId: tId.value,
      items: pStore.items.length,
      found: userPlayer
    })

    if (userPlayer?.role) {
      console.log('👤 [TournamentCompetition] Role desde participación:', userPlayer.role)
      return userPlayer.role as Role
    }
  }

  // Fallback al rol base
  console.log('👤 [TournamentCompetition] Role fallback:', baseRole)
  return baseRole
})
const isLoading = ref(false)
const showPlayerProfile = ref(false)
const selectedPlayerId = ref<string | null>(null)

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
      case 'coach':
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
const teamRef = ref<{ refetch: () => Promise<void> } | null>(null)


/* Diálogos Equipos/Jugadores */
const showTeamForm = ref(false)
const teamModel = ref<Partial<Team> | null>(null)
const showPlayers = ref(false)
const currentTeam = ref<Team | null>(null)

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
  await fetchByRole();

  // Si ya hay un torneo seleccionado al montar, cargar sus datos
  if (tId.value) {
    await fetchTournament(tId.value);
    await teamStore.fetch(tId.value);
    await loadTeams();

    // Cargar participaciones del usuario para obtener su rol en este torneo
    if (uStore.user?.email) {
      await pStore.fetchByEmail(uStore.user.email);
      console.log('📋 [onMounted] Participaciones del usuario cargadas:', pStore.items);
    }

    // Si es coach, team o player, obtener su equipo automáticamente
    if ((role.value === 'coach' || role.value === 'player' || role.value === 'team') && uStore.user?.uid) {
      console.log('🔍 Buscando equipo para', role.value, '- UID:', uStore.user.uid, 'Torneo:', tId.value);

      // Las participaciones ya fueron cargadas arriba con fetchByEmail
      console.log('📋 Participaciones en store:', pStore.items.length);

      // Buscar al usuario en las participaciones del torneo actual
      const userInTournament = pStore.items.find(p =>
        p.id === uStore.user?.uid && p.tournamentId === tId.value
      );

      console.log('🏆 Usuario en este torneo:', userInTournament);

      if (userInTournament?.teamId) {
        const team = teamStore.items.find(t => t.id === userInTournament.teamId);
        console.log('⚽ Equipo encontrado:', team);
        if (team) {
          currentTeam.value = team;
          console.log('✅ currentTeam asignado:', currentTeam.value);
        }
      } else {
        console.log('❌ No se encontró teamId para el usuario');
      }
    }
  }

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

  // Watch tournament ID changes and load all data
  watch(tId, async (newTId, oldTId) => {
    if (newTId !== oldTId && newTId) {
      // Cambiar al tab de torneo automáticamente
      tab.value = 'tournament';

      // Cargar datos del torneo
      await fetchTournament(newTId);

      // Cargar equipos para el store (usado en TeamsPanel y TournamentInfoPanel)
      await teamStore.fetch(newTId);

      // Cargar lista mínima de equipos (usado en selects/dialogs)
      await loadTeams();

      // Cargar participaciones del usuario para obtener su rol en este torneo
      if (uStore.user?.email) {
        await pStore.fetchByEmail(uStore.user.email);
        console.log('📋 [Watch] Participaciones del usuario cargadas:', pStore.items);
      }

      // Si es coach, team o player, obtener su equipo automáticamente
      if ((role.value === 'coach' || role.value === 'player' || role.value === 'team') && uStore.user?.uid) {
        console.log('🔍 [Watch] Buscando equipo para', role.value, '- UID:', uStore.user.uid, 'Torneo:', newTId);

        // Las participaciones ya fueron cargadas arriba con fetchByEmail
        console.log('📋 [Watch] Participaciones en store:', pStore.items.length);

        // Buscar al usuario en las participaciones del torneo actual
        const userInTournament = pStore.items.find(p =>
          p.id === uStore.user?.uid && p.tournamentId === newTId
        );

        console.log('🏆 [Watch] Usuario en este torneo:', userInTournament);

        if (userInTournament?.teamId) {
          const team = teamStore.items.find(t => t.id === userInTournament.teamId);
          console.log('⚽ [Watch] Equipo encontrado:', team);
          if (team) {
            currentTeam.value = team;
            console.log('✅ [Watch] currentTeam asignado:', currentTeam.value);
          }
        } else {
          console.log('❌ [Watch] No se encontró teamId para el usuario');
        }
      }
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

.tournament-competition-page {
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
    font-size: 1rem;
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
