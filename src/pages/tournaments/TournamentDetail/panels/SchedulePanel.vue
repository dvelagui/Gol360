<template>
  <div class="q-pa-none">
    <div class="row items-center q-mb-sm">
      <q-space />
      <q-select v-model="status" :options="statusOptions" dense standout label="Estado" clearable class="q-mr-sm"
        style="min-width: 160px" />
      <q-select v-model="phase" :options="phaseOptions" dense standout label="Fase" clearable
        style="min-width: 160px" />
    </div>

    <div v-if="store.loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <div v-else class="grid q-col-gutter-md" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
      <MatchCard v-for="m in store.items" :key="m.id" :match="m" :team-home="m.homeTeamId" :team-away="m.awayTeamId">
        <template #actions>
          <div class="row q-gutter-sm q-mt-sm">
            <q-btn dense flat icon="summarize" color="primary" label="Resultados" @click="$emit('results', m)" />
            <q-btn v-if="canEdit" dense flat icon="edit" color="primary" @click="$emit('edit', m)" />
            <q-btn v-if="canEdit" dense flat icon="delete" color="negative" @click="onRemove(m.id)" />
          </div>
        </template>
      </MatchCard>
    </div>

    <div v-if="!store.loading && !store.items.length" class="q-my-xl text-grey-6">
      <div class="text-subtitle1 q-mb-xs">No hay partidos programados</div>
      <div class="text-caption">Usa “Nuevo partido” en el header.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed, defineExpose } from 'vue'
import MatchCard from '@/components/tournaments/MatchCard.vue'
import { useMatchStore } from '@/stores/matches'
import { listTeamsByTournament } from '@/services/teamService'
import type { MatchPhase, MatchStatus, MatchPhaseOption, MatchStatusOption } from '@/types/competition'
import type { Team } from '@/types/auth'
import type { Match } from '@/types/competition'
import { Notify } from 'quasar'

const props = defineProps<{
  tournamentId: string
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()

defineEmits<{
  (e: 'edit', m: Match): void
  (e: 'results', m: Match): void
}>()

const store = useMatchStore()
const status = ref<MatchStatus | null>(null)
const phase = ref<MatchPhase | null>(null)
const statusOptions: MatchStatusOption[] = [
  { label: 'Programado', value: 'scheduled' },
  { label: 'En Progreso', value: 'in_progress' },
  { label: 'Finalizado', value: 'finished' },
  { label: 'Cancelado', value: 'canceled' },
  { label: 'WO', value: 'walkover' }
]

const phaseOptions: MatchPhaseOption[] = [
  { label: 'Fase Grupal', value: 'regular' },
  { label: 'Eliminatorias', value: 'playoff' },
  { label: 'Semifinal', value: 'semifinal' },
  { label: 'Final', value: 'final' }
]

const canEdit = computed(() => props.role === 'admin' || props.role === 'manager')

// cache equipos mínimos para tarjetas
const teams = ref<Array<Pick<Team, 'id' | 'displayName'>>>([])

// fetch inicial
async function fetchNow() {
  const filters: { status?: MatchStatus; phase?: MatchPhase } = {
    ...(status.value ? { status: status.value } : {}),
    ...(phase.value ? { phase: phase.value } : {})
  }
  await store.fetch(props.tournamentId, filters)
}
defineExpose({ refetch: fetchNow }) // ← el padre puede pedir un refresh

onMounted(async () => {
  await fetchNow()
  try {
    const list = await listTeamsByTournament(props.tournamentId)
    teams.value = list.map(t => ({ id: t.id, displayName: t.displayName }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos'
    Notify.create({ type: 'negative', message: msg })
  }
})

watch([status, phase], fetchNow)

// eliminar partido
async function onRemove(id: string) {
  try {
    await store.remove(id)
    Notify.create({ type: 'positive', message: 'Partido eliminado' })
    await fetchNow()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo eliminar'
    Notify.create({ type: 'negative', message: msg })
  }
}
</script>

<style scoped>
.grid {
  display: grid;
}
</style>
