<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-center justify-md-between q-mb-md">
      <div>
        <div class="sports-font text-h4">El camerino <q-icon name="sports_soccer" /></div>
      </div>
    </div>
    <div class="row items-center justify-between q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-select
          v-model="selectedTournament"
          :options="tournaments"
          option-label="displayName"
          dense
          filled
          label="Seleccione el campeonato"
          @update:model-value="updateSelection"
        >
          <template #prepend>
            <q-icon name="emoji_events" color="primary" />
          </template>
        </q-select>
        <div class="text-caption text-grey-7 q-mt-sm text-right">ID: {{ tId }}</div>
      </div>
        <div class="col-12 col-md-9 text-md-right text-center ad-banner">
          <!-- <img src="@/assets/display_banner_01.jpg" alt="banner"> -->
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
import { Notify } from 'quasar'
import { useDatabaseStore } from '@/stores/database'
import { useTournamentStore } from '@/stores/tournaments'
import { useUserStore } from '@/stores/user'
import { usePlayerStore } from '@/stores/players'
import { useTeamStore } from '@/stores/teams'
import { useTournamentSelection } from '@/composables/useTournamentSelection'
import { listTeamsByTournament } from '@/services/teamService'
import type { Tournament } from '@/types/auth'

import type { Team } from '@/types/auth'

/* Lazy components */
const TournamentInfoPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/TournamentInfoPanel.vue'))
const TeamsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/TeamsPanel.vue'))
const PlayersPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/PlayersPanel.vue'))
const TeamFormDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/TeamFormDialog.vue'))
const PlayersDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/PlayersDialog.vue'))
const PlayerProfileDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/PlayerProfileDialog.vue'))


type Role = 'admin' | 'manager' | 'team' | 'player' | undefined
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

const role = computed<Role>(() => database.userData?.role)
const isLoading = ref(false)
const showPlayerProfile = ref(false)
const selectedPlayerId = ref<string | null>(null)

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
    }
  }, { immediate: false });
})
</script>

<style scoped lang="scss">
.rounded-borders {
  border-radius: 12px;
}
.sports-font {
  font-family: 'Arial Black', Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #f2c526;
  -webkit-text-stroke: 2px #013f21;
  text-shadow: 0px 0px 10px #218e61;
  background-color: #013f21;
  padding: 2px 8px;
  border-radius: 10px;
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
</style>
