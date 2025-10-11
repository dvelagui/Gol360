<template>
  <div class="rankings-panel">
    <div class="panel-header">
      <div class="header-content">
        <q-icon name="military_tech" size="28px" color="primary" class="q-mr-sm" />
        <div class="text-h6 text-weight-bold">Rankings y Estadísticas</div>
      </div>
      <q-btn
        round
        flat
        icon="refresh"
        color="primary"
        @click="refetch"
        :loading="loading"
      >
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      active-color="primary"
      indicator-color="primary"
      align="justify"
      class="ranking-tabs"
      :breakpoint="0"
    >
      <q-tab name="scorers" icon="sports_soccer" :label="$q.screen.gt.xs ? 'Goleadores' : ''" />
      <q-tab name="assists" icon="sports" :label="$q.screen.gt.xs ? 'Asistencias' : ''" />
      <q-tab name="goalkeepers" icon="shield" :label="$q.screen.gt.xs ? 'Porteros' : ''" />
      <q-tab name="fairplay" icon="emoji_events" :label="$q.screen.gt.xs ? 'Fair Play' : ''" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="activeTab" animated class="rankings-content">

      <q-tab-panel name="scorers" class="q-pa-none">
        <RankingList
          :items="topScorers"
          title="Top Goleadores"
          icon="sports_soccer"
          icon-color="positive"
          :empty-message="'Sin goles registrados aún'"
        >
          <template #item="{ item, index }">
            <div class="ranking-item">
              <div class="position-badge" :class="getPositionClass(index + 1)">
                {{ index + 1 }}
              </div>
              <div class="player-info">
                <div class="player-name">{{ (item as ScorerItem).playerName }}</div>
                <div class="player-team">{{ teamName((item as ScorerItem).teamId) }}</div>
              </div>
              <div class="stat-value">
                <q-icon name="sports_soccer" size="20px" color="positive" />
                <span class="value">{{ (item as ScorerItem).goals }}</span>
              </div>
            </div>
          </template>
        </RankingList>
      </q-tab-panel>


      <q-tab-panel name="assists" class="q-pa-none">
        <RankingList
          :items="topAssists"
          title="Top Asistencias"
          icon="sports"
          icon-color="info"
          :empty-message="'Sin asistencias registradas aún'"
        >
          <template #item="{ item, index }">
            <div class="ranking-item">
              <div class="position-badge" :class="getPositionClass(index + 1)">
                {{ index + 1 }}
              </div>
              <div class="player-info">
                <div class="player-name">{{ (item as AssistItem).playerName }}</div>
                <div class="player-team">{{ teamName((item as AssistItem).teamId) }}</div>
              </div>
              <div class="stat-value">
                <q-icon name="sports" size="20px" color="info" />
                <span class="value">{{ (item as AssistItem).assists }}</span>
              </div>
            </div>
          </template>
        </RankingList>
      </q-tab-panel>

      <q-tab-panel name="goalkeepers" class="q-pa-none">
        <RankingList
          :items="topGoalkeepers"
          title="Porteros - Malla Menos Vencida"
          icon="shield"
          icon-color="primary"
          :empty-message="'Sin datos de porteros aún'"
        >
          <template #item="{ item, index }">
            <div class="ranking-item">
              <div class="position-badge" :class="getPositionClass(index + 1)">
                {{ index + 1 }}
              </div>
              <div class="player-info">
                <div class="player-name">{{ (item as GoalkeeperItem).playerName }}</div>
                <div class="player-team">{{ teamName((item as GoalkeeperItem).teamId) }}</div>
              </div>
              <div class="stat-value multi-stat">
                <div class="stat-group">
                  <q-icon name="sports_soccer" size="16px" color="negative" />
                  <span class="value-sm">{{ (item as GoalkeeperItem).goalsAgainst }}</span>
                </div>
                <div class="stat-group">
                  <q-icon name="event" size="16px" color="grey-6" />
                  <span class="value-sm">{{ (item as GoalkeeperItem).matches }}</span>
                </div>
                <div class="stat-highlight">
                  {{ (item as GoalkeeperItem).average.toFixed(2) }}
                </div>
              </div>
            </div>
          </template>
        </RankingList>
      </q-tab-panel>

      <q-tab-panel name="fairplay" class="q-pa-none">
        <RankingList
          :items="fairPlay"
          title="Fair Play - Equipos con Menos Tarjetas"
          icon="emoji_events"
          icon-color="amber"
          :empty-message="'Sin tarjetas registradas'"
        >
          <template #item="{ item, index }">
            <div class="ranking-item">
              <div class="position-badge" :class="getPositionClass(index + 1)">
                {{ index + 1 }}
              </div>
              <div class="player-info">
                <div class="player-name">{{ teamName((item as FairPlayItem).teamId) }}</div>
                <div class="player-team">Total: {{ (item as FairPlayItem).yellow + (item as FairPlayItem).red }} tarjetas</div>
              </div>
              <div class="stat-value multi-stat">
                <div class="card-badge yellow-card">
                  <q-icon name="square" size="16px" />
                  {{ (item as FairPlayItem).yellow }}
                </div>
                <div class="card-badge red-card">
                  <q-icon name="stop" size="16px" />
                  {{ (item as FairPlayItem).red }}
                </div>
              </div>
            </div>
          </template>
        </RankingList>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import type { MatchEvent } from '@/types/competition'
import type { Team } from '@/types/auth'
import { useEventStore } from '@/stores/events'
import { useMatchStore } from '@/stores/matches'
import { listTeamsByTournament } from '@/services/teamService'

const RankingList = defineAsyncComponent(() => import('./RankingList.vue'))

const props = defineProps<{ tournamentId: string }>()

// Type definitions for slot props
type ScorerItem = { playerId: string; playerName: string; teamId: string; goals: number }
type AssistItem = { playerId: string; playerName: string; teamId: string; assists: number }
type GoalkeeperItem = { playerId: string; playerName: string; teamId: string; goalsAgainst: number; matches: number; average: number }
type FairPlayItem = { teamId: string; yellow: number; red: number }

const $q = useQuasar()
const eStore = useEventStore()
const mStore = useMatchStore()
const loading = ref(false)
const teams = ref<Team[]>([])
const activeTab = ref('scorers')

async function loadTeamsAndPlayers() {
  const t = await listTeamsByTournament(props.tournamentId)
  teams.value = t
}

async function refetch() {
  console.log('🔄 [RankingsPanel] Iniciando refetch para tournamentId:', props.tournamentId)
  loading.value = true
  try {
    await Promise.all([
      eStore.fetchByTournament(props.tournamentId),
      mStore.fetch(props.tournamentId),
      loadTeamsAndPlayers()
    ])
    console.log('✅ [RankingsPanel] Datos cargados:')
    console.log('  - Eventos:', eStore.items.length)
    console.log('  - Partidos:', mStore.items.length)
    console.log('  - Equipos:', teams.value.length)

    // Mostrar algunos eventos de ejemplo
    console.log('📋 Primeros 3 eventos:', eStore.items.slice(0, 3))
  } finally {
    loading.value = false
  }
}

onMounted(refetch)

/* Top Scorers */
const topScorers = computed(() => {
  console.log('🔍 [RankingsPanel] Calculando topScorers...')
  console.log('📊 Total eventos en store:', eStore.items.length)

  const goalsMap = new Map<string, { playerId: string; playerName: string; teamId: string; goals: number }>()

  let goalCount = 0
  let approvedCount = 0

  for (const ev of eStore.items as MatchEvent[]) {
    if (ev.type === 'gol' || ev.type === 'penalti_marcado') {
      goalCount++
      console.log('⚽ Evento gol encontrado:', {
        type: ev.type,
        status: ev.status,
        playerId: ev.playerId,
        teamId: ev.teamId
      })
    }

    if (ev.type !== 'gol' && ev.type !== 'penalti_marcado') continue
    if (ev.status !== 'aprobado') {
      console.log('❌ Gol no aprobado, status:', ev.status)
      continue
    }
    approvedCount++

    if (!ev.playerId) {
      console.log('⚠️ Gol sin playerId')
      continue
    }

    const playerId = typeof ev.playerId === 'object' ? ev.playerId.id : ev.playerId
    const playerName = typeof ev.playerId === 'object' ? ev.playerId.name : 'Jugador'
    const teamId = typeof ev.teamId === 'object' ? ev.teamId.id : ev.teamId

    const rec = goalsMap.get(playerId) ?? { playerId, playerName, teamId, goals: 0 }
    rec.goals++
    goalsMap.set(playerId, rec)
  }

  console.log(`📈 Goles totales: ${goalCount}, Aprobados: ${approvedCount}, Jugadores únicos: ${goalsMap.size}`)

  const result = Array.from(goalsMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)

  console.log('🏆 Top Scorers resultado:', result)
  return result
})

/* Top Assists */
const topAssists = computed(() => {
  const assistsMap = new Map<string, { playerId: string; playerName: string; teamId: string; assists: number }>()

  for (const ev of eStore.items as MatchEvent[]) {
    if (ev.type !== 'asistencia') continue
    if (ev.status !== 'aprobado') continue
    if (!ev.playerId) continue

    const playerId = typeof ev.playerId === 'object' ? ev.playerId.id : ev.playerId
    const playerName = typeof ev.playerId === 'object' ? ev.playerId.name : 'Jugador'
    const teamId = typeof ev.teamId === 'object' ? ev.teamId.id : ev.teamId

    const rec = assistsMap.get(playerId) ?? { playerId, playerName, teamId, assists: 0 }
    rec.assists++
    assistsMap.set(playerId, rec)
  }

  return Array.from(assistsMap.values())
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10)
})

/* Top Goalkeepers - Malla menos vencida */
const topGoalkeepers = computed(() => {
  // Agrupar goles en contra por equipo y partido
  const teamGoalsMap = new Map<string, { teamId: string; goalsAgainst: number; matches: Set<string> }>()

  for (const ev of eStore.items as MatchEvent[]) {
    if (ev.type !== 'gol' && ev.type !== 'penalti_marcado') continue
    if (ev.status !== 'aprobado') continue

    const teamId = typeof ev.teamId === 'object' ? ev.teamId.id : ev.teamId
    const matchId = ev.matchId

    // Encontrar equipo contrario en el partido
    const match = mStore.items.find(m => m.id === matchId)
    if (!match) continue

    // Normalizar IDs de equipos (pueden ser string u objeto)
    const homeTeamId = typeof match.homeTeamId === 'object' ? match.homeTeamId.id : match.homeTeamId
    const awayTeamId = typeof match.awayTeamId === 'object' ? match.awayTeamId.id : match.awayTeamId

    const opposingTeamId = homeTeamId === teamId ? awayTeamId : homeTeamId

    const rec = teamGoalsMap.get(opposingTeamId) ?? {
      teamId: opposingTeamId,
      goalsAgainst: 0,
      matches: new Set<string>()
    }
    rec.goalsAgainst++
    rec.matches.add(matchId)
    teamGoalsMap.set(opposingTeamId, rec)
  }

  // Convertir a array con promedio
  const goalkeepersData = Array.from(teamGoalsMap.values())
    .map(rec => ({
      playerId: rec.teamId,
      playerName: `Portero ${teamName(rec.teamId)}`,
      teamId: rec.teamId,
      goalsAgainst: rec.goalsAgainst,
      matches: rec.matches.size,
      average: rec.matches.size > 0 ? rec.goalsAgainst / rec.matches.size : 0
    }))
    .sort((a, b) => a.average - b.average)
    .slice(0, 10)

  return goalkeepersData
})

/* Fair Play - ordenado de menos a más tarjetas */
const fairPlay = computed(() => {
  const fp = new Map<string, { teamId: string; yellow: number; red: number }>()

  for (const ev of eStore.items as MatchEvent[]) {
    if (ev.type !== 'amarilla' && ev.type !== 'roja') continue
    if (ev.status !== 'aprobado') continue

    const tid = typeof ev.teamId === 'object' ? ev.teamId.id : ev.teamId
    const row = fp.get(tid) ?? { teamId: tid, yellow: 0, red: 0 }

    if (ev.type === 'amarilla') row.yellow++
    if (ev.type === 'roja') row.red++

    fp.set(tid, row)
  }

  // Ordenar por total de tarjetas (menos es mejor para fair play)
  return Array.from(fp.values())
    .sort((a, b) => (a.yellow + a.red) - (b.yellow + b.red))
    .slice(0, 10)
})

function teamName(id: string) {
  return teams.value.find(t => t.id === id)?.displayName ?? '—'
}

function getPositionClass(pos: number): string {
  if (pos === 1) return 'first'
  if (pos === 2) return 'second'
  if (pos === 3) return 'third'
  return 'default'
}

// expone a padre
defineExpose({ refetch })
</script>

<style scoped lang="scss">
.rankings-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E0E0E0;
}

.header-content {
  display: flex;
  align-items: center;
}

.ranking-tabs {
  background: #F5F5F5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.rankings-content {
  background: transparent;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #064F34;
  }
}

.position-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;

  &.first {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    box-shadow: 0 4px 12px rgba(255, 165, 0, 0.4);
  }

  &.second {
    background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
    color: white;
    box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
  }

  &.third {
    background: linear-gradient(135deg, #CD7F32, #B87333);
    color: white;
    box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
  }

  &.default {
    background: #F5F5F5;
    color: #616161;
    border: 2px solid #E0E0E0;
  }
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-team {
  font-size: 0.85rem;
  color: #757575;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3rem;
  font-weight: 800;
  color: #064F34;
  flex-shrink: 0;

  .value {
    min-width: 30px;
    text-align: right;
  }

  &.multi-stat {
    gap: 12px;
  }
}

.stat-group {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #616161;

  .value-sm {
    font-weight: 600;
  }
}

.stat-highlight {
  background: linear-gradient(135deg, #064F34, #138A59);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
}

.card-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;

  &.yellow-card {
    background: #FFF9C4;
    color: #F57F17;
    border: 2px solid #FBC02D;
  }

  &.red-card {
    background: #FFCDD2;
    color: #C62828;
    border: 2px solid #E53935;
  }
}

@media (max-width: 600px) {
  .rankings-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .panel-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .header-content .text-h6 {
    font-size: 1.1rem;
  }

  .ranking-item {
    gap: 12px;
    padding: 12px;
  }

  .position-badge {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .player-name {
    font-size: 0.9rem;
  }

  .player-team {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .stat-highlight {
    padding: 4px 8px;
    font-size: 0.9rem;
  }

  .card-badge {
    padding: 4px 8px;
    font-size: 0.85rem;
  }
}
</style>
