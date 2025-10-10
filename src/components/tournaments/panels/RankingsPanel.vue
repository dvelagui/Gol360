<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Rankings</div>
      <q-space />
      <q-btn dense flat icon="refresh" @click="refetch" :loading="loading" />
    </div>

    <div class="row q-col-gutter-md">
      <!-- Top Scorers -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section class="text-subtitle2">Goleadores</q-card-section>
          <q-separator />
          <q-list v-if="topScorers.length" separator>
            <q-item v-for="(s, i) in topScorers" :key="s.playerId">
              <q-item-section avatar><q-badge outline>{{ i + 1 }}</q-badge></q-item-section>
              <q-item-section>
                <q-item-label>{{ s.playerName }}</q-item-label>
                <q-item-label caption>{{ teamName(s.teamId) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip square>{{ s.goals }}</q-chip>
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else class="bg-grey-2 text-grey-7 q-pa-sm">
            Sin datos por ahora.
          </q-banner>
        </q-card>
      </div>

      <!-- Fair Play (amarillas/rojas totales por equipo) -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section class="text-subtitle2">Fair Play (amarillas/rojas)</q-card-section>
          <q-separator />
          <q-list v-if="fairPlay.length" separator>
            <q-item v-for="t in fairPlay" :key="t.teamId">
              <q-item-section>
                <q-item-label>{{ teamName(t.teamId) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip dense color="warning" text-color="black" square>{{ t.yellow }}</q-chip>
                <q-chip dense color="negative" text-color="white" square class="q-ml-xs">{{ t.red }}</q-chip>
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else class="bg-grey-2 text-grey-7 q-pa-sm">
            Sin tarjetas registradas.
          </q-banner>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { MatchEvent } from '@/types/competition'
import type { Team, Player } from '@/types/auth'
import { useEventStore } from '@/stores/events'
import { listTeamsByTournament } from '@/services/teamService'
import { listPlayersByTeam } from '@/services/playerService'

const props = defineProps<{ tournamentId: string }>()

const eStore = useEventStore()
const loading = ref(false)
const teams = ref<Team[]>([])
const playersById = ref<Map<string, Player>>(new Map())

async function loadTeamsAndPlayers() {
  const t = await listTeamsByTournament(props.tournamentId)
  teams.value = t
  // precargar jugadores por equipo para poder mostrar nombre
  const map = new Map<string, Player>()
  for (const team of t) {
    const plist = await listPlayersByTeam(team.id)
    plist.forEach(p => map.set(p.id, p))
  }
  playersById.value = map
}

async function refetch() {
  loading.value = true
  try {
    await Promise.all([eStore.fetch(props.tournamentId), loadTeamsAndPlayers()])
  } finally {
    loading.value = false
  }
}

onMounted(refetch)

/* Top Scorers (usa eventos 'goal' y 'own_goal' no suma a autor) */
const topScorers = computed(() => {
  const goalsMap = new Map<string, { playerId: string; playerName: string; teamId: string; goals: number }>()
  for (const ev of eStore.items as MatchEvent[]) {
    if (ev.type !== 'gol' && ev.type !== 'penalti_marcado') continue
    if (!ev.playerId) continue
    const p = typeof ev.playerId === 'object' ? ev.playerId.id : ev.playerId
    const player = playersById.value.get(p)
    if (!player || !player.teamId) continue // Skip if no player or no teamId
    const rec = goalsMap.get(p) ?? { playerId: p, playerName: player.displayName, teamId: player.teamId, goals: 0 }
    rec.goals++
    goalsMap.set(p, rec)
  }
  return Array.from(goalsMap.values()).sort((a, b) => b.goals - a.goals).slice(0, 10)
})

/* Fair Play simple: suma amarillas/rojas por equipo */
const fairPlay = computed(() => {
  const fp = new Map<string, { teamId: string; yellow: number; red: number }>()
  for (const ev of eStore.items as MatchEvent[]) {
    if (ev.type !== 'amarilla' && ev.type !== 'roja') continue
    const tid = typeof ev.teamId === 'object' ? ev.teamId.id : ev.teamId
    const row = fp.get(tid) ?? { teamId: tid, yellow: 0, red: 0 }
    if (ev.type === 'amarilla') row.yellow++
    if (ev.type === 'roja') row.red++
    fp.set(tid, row)
  }
  return Array.from(fp.values()).sort((a, b) => (b.red + b.yellow) - (a.red + a.yellow))
})

function teamName(id: string) {
  return teams.value.find(t => t.id === id)?.displayName ?? '—'
}

// expone a padre
defineExpose({ refetch })
</script>
