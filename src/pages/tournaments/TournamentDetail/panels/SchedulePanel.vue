<template>
  <div class="q-pa-none">

    <div v-if="mStore.loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="100px" />
      <q-skeleton type="rect" class="q-mb-md" height="100px" />
      <q-skeleton type="rect" class="q-mb-md" height="100px" />
    </div>

    <div v-else-if="!groupedRoundsKeys.length" class="q-my-xl text-grey-6">
      <div class="text-subtitle2">No hay partidos programados</div>
      <div class="text-caption">Cuando crees el calendario o agregues partidos, aparecerán aquí.</div>
    </div>

    <div v-else class="container-match q-gutter-y-md">
      <div v-for="roundKey in groupedRoundsKeys" :key="roundKey" class="rounded-borders bg-white q-pa-xs shadow-2">
        <div class="text-h6 q-mb-xs text-center text-primary font-weight-bold">{{ roundTitle(roundKey) }}</div>

        <div v-for="(m, idx) in groupedRounds[roundKey]" :key="m.id" class="match-row">
          <div class="row items-center justify-between q-pb-xs q-pt-xs">
            <div class="text-caption text-grey-7">
              {{ formatDateTime(m.date) }}
              <span class="text-grey-8">
                <span v-if="m.group"> · Grupo {{ m.group }}</span>
              </span>
            </div>

            <div class="row items-center q-gutter-xs">
              <q-btn v-if="canEdit" dense round flat color="dark" icon="edit" :title="'Editar partido'"
                @click="$emit('edit', m)" size="20" />
              <q-btn dense round flat color="primary" icon="event" :title="'Resultados / eventos'"
                @click="$emit('results', m)" />
            </div>
          </div>
          <MatchCard :match="m" :team-by-id="teamById" class="q-mb-sm" @edit="$emit('edit', m)"
            @results="$emit('results', m)" />
          <q-separator v-if="idx < (groupedRounds[roundKey]?.length ?? 0) - 1" spaced inset color="grey-4" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, defineAsyncComponent, watch } from 'vue'
import { Notify } from 'quasar'
import { useMatchStore } from '@/stores/matches'
import { listTeamsByTournament } from '@/services/teamService'
import type { Match } from '@/types/competition'

const MatchCard = defineAsyncComponent(() => import('@/components/tournaments/MatchCard.vue'))

const props = defineProps<{
  tournamentId: string
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()

defineEmits<{
  (e: 'edit', m: Match): void
  (e: 'results', m: Match): void
}>()

const canEdit = computed(() => props.role === 'admin' || props.role === 'manager')

/* stores & data */
const mStore = useMatchStore()
type TeamMin = { id: string; name: string; crestUrl?: string }
const teams = ref<TeamMin[]>([])

function teamById(id: string): TeamMin | undefined {
  return teams.value.find(t => t.id === id)
}

onMounted(async () => {
  try {
    await Promise.all([
      mStore.fetch(props.tournamentId),
      loadTeams()
    ])
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo cargar programación' })
  }
})

async function loadTeams(): Promise<void> {
  const list = await listTeamsByTournament(props.tournamentId)
  // normalizamos a TeamMin
  teams.value = list.map((t: { id: string; displayName: string; crestUrl?: string }) => {
    const team: TeamMin = {
      id: t.id,
      name: t.displayName
    }
    if (t.crestUrl !== undefined) {
      team.crestUrl = t.crestUrl
    }
    return team
  })
}

/* agrupación por “round” */
const groupedRounds = computed<Record<string, Match[]>>(() => {
  const out: Record<string, Match[]> = {}
  for (const m of mStore.items.slice().sort((a, b) => (a.date || 0) - (b.date || 0))) {
    const r = String(m.round ?? 'Sin ronda')
    if (!out[r]) out[r] = []
    out[r].push(m)
  }
  return out
})

const groupedRoundsKeys = computed(() => Object.keys(groupedRounds.value))

function roundTitle(key: string): string {
  // si viene "Fecha X" lo dejamos; si es número, usamos “X° FECHA”
  const n = Number(key)
  if (!Number.isNaN(n)) return `${n}° FECHA`
  // si ya te llega "Fecha 7" lo usamos como está
  return key
}

/* helpers UI */
function pad2(n: number): string { return n < 10 ? `0${n}` : String(n) }
const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

function formatDateTime(ms?: number): string {
  if (!ms) return '—'
  const d = new Date(ms)
  const dd = pad2(d.getDate())
  const mon = months[d.getMonth()]
  const day = days[d.getDay()]
  const h = d.getHours()
  const mm = pad2(d.getMinutes())
  const hh = h % 12 || 12
  const ampm = h < 12 ? 'a. m.' : 'p. m.'
  return `${dd} ${mon} | ${day} · ${hh}:${mm} ${ampm}`
}

watch(() => props.tournamentId, async () => {
  await mStore.fetch(props.tournamentId)
})
</script>

<style scoped>
.q-btn .q-icon,
.q-btn .q-spinner {
  font-size: 20px;
  padding: 0;
}

.container-match {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

.font-weight-bold {
  font-weight: 900 !important;
}

.rounded-borders {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.match-row {
  padding: 4px 0;
}
</style>
