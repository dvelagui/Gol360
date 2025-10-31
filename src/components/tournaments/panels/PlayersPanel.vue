<template>
  <div class="q-pa-md">

    <div class="row items-center q-gutter-sm q-mb-md">
      <q-select v-model="selectedTeamId" :options="teamOptions" option-value="id" option-label="name" dense filled
        label="Equipo" style="min-width: 260px" />
      <q-space />
      <q-badge v-if="team" outline color="primary">
        {{ players.length }} jugador(es)
      </q-badge>
    </div>

    <div v-if="team" class="header-card q-mb-xs row">
      <div class="header-overlay">
        <div class="row justify-between items-end full-width">
          <div class="col-10 col-md-10 row items-center q-gutter-sm">
            <q-avatar size="56px" class="bg-white">
              <img v-if="team.crestUrl" :src="team.crestUrl" alt="crest" />
              <q-icon v-else name="emoji_events" />
            </q-avatar>
            <div>
              <div class="text-h6 text-white">{{ team.displayName }}</div>
              <div class="text-caption text-white text-weight-regular">
                {{ team.city }} <span v-if="team.group"> · {{ team.group }}</span>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-2 q-pa-xs text-right">
            <q-btn v-if="canCreateMatch" class="q-my-xs text-caption" outline color="white" text-color="white" label="Editar Jugadores"
              unelevated :disable="!team" @click="team && $emit('add-players', team)" />
          </div>
        </div>
      </div>
    </div>

    <q-markup-table flat bordered class="rounded-borders">
      <thead>
        <tr>
          <th class="text-left">Jugadores</th>
          <th class="text-center">G</th>
          <th class="text-center">J</th>
          <th class="text-center">T.AM</th>
          <th class="text-center">T.R</th>
          <th class="text-center">T.AZ</th>
          <th class="text-center">FAL</th>
          <th class="text-center">ASS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in players" :key="p.id" class="row-click" @click="emitOpen(p.id)">
          <td class="text-left">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="32px">
                <q-icon name="person" />
              </q-avatar>
              <div>
                <div class="text-body1">{{ p.displayName }}</div>
                <div class="text-caption text-grey-7">
                  {{ p.position || '—' }} <span v-if="p.jersey"> · #{{ p.jersey }}</span>
                  <q-badge v-if="p.role === 'team'" color="amber-7" class="q-ml-xs" outline>Capitán</q-badge>
                  <q-badge v-if="p.role === 'coach'" color="secondary" class="q-ml-xs" outline>Entrenador</q-badge>
                </div>
              </div>
            </div>
          </td>
          <td class="text-center">{{ p.stats.goals }}</td>
          <td class="text-center">{{ p.stats.matches }}</td>
          <td class="text-center"><q-icon name="circle" size="10px" class="text-amber" /> {{ p.stats.yellow }}</td>
          <td class="text-center"><q-icon name="circle" size="10px" color="red"  class="text-negative" /> {{ p.stats.red }}</td>
          <td class="text-center"><q-icon name="circle" size="10px" color="blue" class="text-primary" /> {{ p.stats.blue }}</td>
          <td class="text-center">{{ p.stats.fouls }}</td>
          <td class="text-center">{{ p.stats.assists }}</td>
        </tr>
        <tr v-if="!players.length">
          <td colspan="8" class="text-center text-grey-7">Sin jugadores</td>
        </tr>
      </tbody>
    </q-markup-table>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTeamStore } from '@/stores/teams'
import { usePlayerStore } from '@/stores/players'
import { getPlayerStatsByTeam } from '@/services/statsService'
import type { Team } from '@/types/auth'
import type { PlayerStats } from '@/services/statsService'

type Role = 'admin' | 'manager' | 'team' | 'player' | 'coach' | undefined

const props = defineProps<{
  tournamentId: string
  role?: Role
  teamSelected: Team | null
}>()

const emit = defineEmits<{
  (e: 'open-profile', playerId: string): void
  (e: 'add-players', team: Team): void
}>()

const canCreateMatch = computed<boolean>(() => {
  const userRole = props.role;
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'team' || userRole === 'coach';
  console.log('🔐 [PlayersPanel] canCreateMatch:', { userRole, canEdit, team: team.value?.displayName });
  return canEdit;
});

const teamStore = useTeamStore()
const playerStore = usePlayerStore()

const selectedTeamId = ref({ id: '', name: '' })
const playerStats = ref<PlayerStats[]>([])
const loadingStats = ref(false)

const teamOptions = computed(() =>
  teamStore.items.map(t => ({ id: t.id, name: t.displayName }))
)

const team = computed<Team | null>(() =>
  teamStore.items.find(t => t.id === selectedTeamId.value.id) ?? null
)

const players = computed(() =>
  playerStore.items.map(p => {
    // Buscar las estadísticas del jugador
    const stats = playerStats.value.find(s => s.playerId === p.id)
    return {
      ...p,
      stats: stats || { goals: 0, matches: 0, yellow: 0, red: 0, blue: 0, fouls: 0, assists: 0 }
    }
  })
)

function emitOpen(id: string) {
  emit('open-profile', id)
}

async function loadPlayerStats(teamId: string) {
  if (!teamId) {
    playerStats.value = []
    return
  }

  loadingStats.value = true
  try {
    playerStats.value = await getPlayerStatsByTeam(teamId)
  } catch (error) {
    console.error('Error loading player stats:', error)
    playerStats.value = []
  } finally {
    loadingStats.value = false
  }
}

watch(selectedTeamId, async (value) => {
  if (value.id) {
    await playerStore.fetchByTeamWithParticipations(value.id)
    await loadPlayerStats(value.id)
  }
})

// Watch para cuando cambie teamSelected desde el padre
watch(() => props.teamSelected, (newTeam) => {
  console.log('👁️ [PlayersPanel] teamSelected cambió:', newTeam);
  if (newTeam) {
    selectedTeamId.value = { id: newTeam.id, name: newTeam.displayName }
    console.log('✅ [PlayersPanel] selectedTeamId actualizado:', selectedTeamId.value);
  }
})

onMounted(async () => {
  console.log('🚀 [PlayersPanel] onMounted - role:', props.role, 'teamSelected:', props.teamSelected);
  // cargar equipos del torneo
  await teamStore.fetch(props.tournamentId)

  selectedTeamId.value = props.teamSelected
    ? { id: props.teamSelected.id, name: props.teamSelected.displayName }
    : { id: '', name: '' }

  console.log('📌 [PlayersPanel] selectedTeamId inicial:', selectedTeamId.value);
})
</script>

<style scoped lang="scss">
.rounded-borders {
  border-radius: 12px;
}

.header-card {
  position: relative;
  height: 140px;
  border-radius: 12px;
  background: linear-gradient(135deg, #064F34, #138A59);
  overflow: hidden;
}

.header-overlay {
  position: absolute;
  inset: 0;
  padding: 16px;
  display: flex;
  align-items: flex-end;
  background: radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, .12), transparent 40%);
}

.row-click {
  cursor: pointer;
}
</style>
