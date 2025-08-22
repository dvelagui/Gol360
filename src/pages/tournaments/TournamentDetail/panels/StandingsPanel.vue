<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Tabla de posiciones</div>
      <q-space />
      <q-btn dense flat icon="refresh" @click="refetch" :loading="loading" />
      <q-btn dense flat :icon="compact ? 'view_list' : 'table_rows'" @click="compact = !compact" />
    </div>

    <q-card flat bordered class="q-pa-sm">
      <q-markup-table v-if="rows.length" :dense="compact" flat>
        <thead>
          <tr>
            <th class="text-left">Equipo</th>
            <th class="text-right">PJ</th>
            <th class="text-right">G</th>
            <th class="text-right">E</th>
            <th class="text-right">P</th>
            <th class="text-right">GF</th>
            <th class="text-right">GC</th>
            <th class="text-right">DG</th>
            <th class="text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.teamId">
            <td class="text-left">
              <div class="row items-center no-wrap">
                <q-avatar size="28px" class="q-mr-sm">
                  <q-icon name="shield" />
                </q-avatar>
                <div class="ellipsis">{{ r.teamName }}</div>
              </div>
            </td>
            <td class="text-right">{{ r.played }}</td>
            <td class="text-right">{{ r.won }}</td>
            <td class="text-right">{{ r.draw }}</td>
            <td class="text-right">{{ r.lost }}</td>
            <td class="text-right">{{ r.goalsFor }}</td>
            <td class="text-right">{{ r.goalsAgainst }}</td>
            <td class="text-right">{{ r.goalDiff }}</td>
            <td class="text-right text-weight-medium">{{ r.points }}</td>
          </tr>
        </tbody>
      </q-markup-table>

      <q-banner v-else class="bg-grey-2 text-grey-7">
        Aún no hay partidos finalizados para calcular la tabla.
      </q-banner>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Match } from '@/types/competition'
import type { Team } from '@/types/auth'
import { computeStandings, type StandingRow } from '@/utils/standings'
import { useMatchStore } from '@/stores/matches'
import { listTeamsByTournament } from '@/services/teamService'

const props = defineProps<{ tournamentId: string }>()

const mStore = useMatchStore()
const loading = ref(false)
const compact = ref(true)
const teams = ref<{ id: string; name: string }[]>([])

async function loadTeams() {
  const list: Team[] = await listTeamsByTournament(props.tournamentId)
  teams.value = list.map(t => ({ id: t.id, name: t.displayName }))
}

async function refetch() {
  loading.value = true
  try {
    await Promise.all([mStore.fetch(props.tournamentId), loadTeams()])
  } finally {
    loading.value = false
  }
}

onMounted(refetch)

const rows = computed<StandingRow[]>(() =>
  computeStandings(teams.value, mStore.items as Match[])
)

// método que expone al padre
defineExpose({ refetch })
</script>
