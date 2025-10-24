<template>
  <div class="q-pa-none">
    <div v-if="isLoading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="100px" />
      <q-skeleton type="rect" class="q-mb-md" height="100px" />
      <q-skeleton type="rect" class="q-mb-md" height="100px" />
    </div>

    <div v-else-if="isEmpty" class="q-my-xl text-grey-6 text-center">
      <q-icon name="event_busy" size="48px" class="q-mb-md text-grey-4" />
      <div class="text-subtitle2">No hay partidos programados</div>
      <div class="text-caption">Cuando crees el calendario o agregues partidos, aparecerán aquí.</div>
    </div>

    <div v-else class="container-match q-gutter-y-md">
      <div v-if="hasCompletedRounds" class="filter-section q-mb-md">
        <q-card flat bordered class="filter-card">
          <q-card-section class="q-pa-sm">
            <q-toggle
              v-model="showCompletedRounds"
              color="primary"
              label="Mostrar fechas completadas"
              left-label
              size="sm"
            />
          </q-card-section>
        </q-card>
      </div>
      <div
        v-for="roundKey in filteredRoundKeys"
        :key="roundKey"
        class="round-container"
      >
        <div class="round-title">{{ getRoundTitle(roundKey) }}</div>

        <div
          v-for="(match, idx) in groupedMatches[roundKey]"
          :key="match.id"
          class="match-row"
        >
          <div class="match-header">
            <div class="match-info">
              {{ getFormattedDateTime(match.date) }}
              <span v-if="match.group" class="group-indicator">
                · Grupo {{ match.group }}
              </span>
            </div>

            <div v-if="canEdit" class="match-actions">
              <q-btn
                dense
                round
                flat
                color="dark"
                icon="edit"
                size="sm"
                @click="handleEdit(match)"
              >
                <q-tooltip>Editar partido</q-tooltip>
              </q-btn>
              <q-btn
                dense
                round
                flat
                color="primary"
                icon="event"
                size="sm"
                @click="handleResults(match)"
              >
                <q-tooltip>Resultados / eventos</q-tooltip>
              </q-btn>
            </div>
          </div>

          <MatchCard
            :match="match"
            :team-by-id="getTeamById"
            :can-edit="canEdit"
            class="q-mb-sm"
            @edit="handleEdit(match)"
            @results="handleResults(match)"
          />

          <q-separator
            v-if="groupedMatches[roundKey] && idx < groupedMatches[roundKey].length - 1"
            spaced
            inset
            color="grey-4"
          />
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

const MatchCard = defineAsyncComponent(() => import('@/components/tournaments/cards/MatchCard.vue'))

interface TeamMin {
  id: string
  name: string
  crestUrl?: string
}

interface GroupedMatches {
  [roundKey: string]: Match[]
}

const props = defineProps<{
  tournamentId: string
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()

const emit = defineEmits<{
  edit: [match: Match]
  results: [match: Match]
}>()

// State
const mStore = useMatchStore()
const teams = ref<TeamMin[]>([])
const isLoadingTeams = ref(false)
const teamsMap = ref(new Map<string, TeamMin>())
const showCompletedRounds = ref(false)

// Computed properties
const canEdit = computed(() => {
  const userRole = props.role
  return userRole === 'admin' || userRole === 'manager'
})

const isLoading = computed(() => mStore.loading || isLoadingTeams.value)

const isEmpty = computed(() =>
  !isLoading.value && mStore.items.length === 0
)

// Memoized team lookup for better performance
const getTeamById = computed(() => {
  return (id: string): TeamMin | undefined => teamsMap.value.get(id)
})

// Memoized matches grouping
const groupedMatches = computed<GroupedMatches>(() => {
  if (mStore.items.length === 0) return {}

  const sortedMatches = [...mStore.items].sort((a, b) => (a.date || 0) - (b.date || 0))
  const groups: GroupedMatches = {}

  for (const match of sortedMatches) {
    const roundKey = String(match.round ?? 'Sin ronda')
    if (!groups[roundKey]) {
      groups[roundKey] = []
    }
    groups[roundKey].push(match)
  }

  return groups
})

const sortedRoundKeys = computed(() => {
  const keys = Object.keys(groupedMatches.value)
  return keys.sort((a, b) => {
    const numA = Number(a)
    const numB = Number(b)

    // Si ambos son números, ordenar numéricamente
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA - numB
    }

    // Si uno es número y otro no, el número va primero
    if (!Number.isNaN(numA)) return -1
    if (!Number.isNaN(numB)) return 1

    // Si ninguno es número, ordenar alfabéticamente
    return a.localeCompare(b)
  })
})

// Verifica si una fecha (round) está completada (todos los partidos finalizados)
function isRoundCompleted(roundKey: string): boolean {
  const matches = groupedMatches.value[roundKey]
  if (!matches || matches.length === 0) return false

  return matches.every(match => match.status === 'terminado')
}

// Computed para saber si hay fechas completadas
const hasCompletedRounds = computed(() => {
  return sortedRoundKeys.value.some(roundKey => isRoundCompleted(roundKey))
})

// Computed para filtrar las fechas según el toggle
const filteredRoundKeys = computed(() => {
  if (showCompletedRounds.value) {
    return sortedRoundKeys.value
  }

  return sortedRoundKeys.value.filter(roundKey => !isRoundCompleted(roundKey))
})

// Round title cache for performance
const roundTitleCache = new Map<string, string>()

function getRoundTitle(key: string): string {
  if (roundTitleCache.has(key)) {
    return roundTitleCache.get(key)!
  }

  const n = Number(key)
  const title = !Number.isNaN(n) ? `${n}° FECHA` : key
  roundTitleCache.set(key, title)
  return title
}

// Date formatting cache for performance
const dateFormatCache = new Map<number, string>()

function getFormattedDateTime(ms?: number): string {
  if (!ms) return '—'

  if (dateFormatCache.has(ms)) {
    return dateFormatCache.get(ms)!
  }

  const date = new Date(ms)
  const day = date.getDate().toString().padStart(2, '0')
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  const month = monthNames[date.getMonth()]
  const dayOfWeek = dayNames[date.getDay()]
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const displayHours = hours % 12 || 12
  const period = hours < 12 ? 'a. m.' : 'p. m.'

  const formatted = `${day} ${month} | ${dayOfWeek} · ${displayHours}:${minutes} ${period}`
  dateFormatCache.set(ms, formatted)
  return formatted
}

// Methods
async function loadTeams(): Promise<void> {
  if (!props.tournamentId || isLoadingTeams.value) return

  isLoadingTeams.value = true
  try {
    const teamsList = await listTeamsByTournament(props.tournamentId)

    teams.value = teamsList.map((team) => {
      // Priorizar crestUrl, luego photoURL, luego string vacío
      const imageUrl = team.crestUrl || team.photoURL || ''

      return {
        id: team.id,
        name: team.displayName,
        crestUrl: imageUrl
      }
    })

    // Create map for O(1) lookups
    teamsMap.value = new Map(teams.value.map(team => [team.id, team]))
  } catch (error) {
    console.error('Error loading teams:', error)
    Notify.create({
      type: 'negative',
      message: 'Error cargando equipos',
      position: 'top'
    })
  } finally {
    isLoadingTeams.value = false
  }
}

async function loadData(): Promise<void> {
  if (!props.tournamentId) return

  try {
    await Promise.all([
      mStore.fetch(props.tournamentId),
      loadTeams()
    ])
  } catch (error) {
    console.error('Error loading schedule data:', error)
    Notify.create({
      type: 'negative',
      message: 'No se pudo cargar la programación',
      position: 'top'
    })
  }
}

function handleEdit(match: Match): void {
  emit('edit', match)
}

function handleResults(match: Match): void {
  emit('results', match)
}

// Expose refetch method for parent component
async function refetch(): Promise<void> {
  await loadData()
}

defineExpose({ refetch })

// Lifecycle
onMounted(() => {
  void loadData()
})

// Watchers
watch(
  () => props.tournamentId,
  async (newId, oldId) => {
    if (newId !== oldId && newId) {
      await loadData()
    }
  }
)
</script>

<style scoped lang="scss">
.container-match {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 4px;
}

.filter-section {
  display: flex;
  justify-content: center;
  padding: 0 4px;
}

.filter-card {
  background: linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%);
  border: 1px solid #E3F2FD;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.round-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  border: 2px solid #e3f2fd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #064F34, #138A59, #1976D2);
  }

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.round-title {
  font-size: 1.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #064F34, #138A59);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 16px;
  padding: 12px 0;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #064F34, #1976D2);
    border-radius: 2px;
  }
}

.match-row {
  padding: 12px 0;
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(25, 118, 210, 0.02);
  }
}

.match-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(6, 79, 52, 0.05), rgba(19, 138, 89, 0.05));
  border-radius: 8px;
  margin-bottom: 8px;
}

.match-info {
  font-size: 0.813rem;
  font-weight: 600;
  color: #064F34;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '📅';
    font-size: 1rem;
  }
}

.group-indicator {
  color: #1976D2;
  font-weight: 700;
  background: rgba(25, 118, 210, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.match-actions {
  display: flex;
  align-items: center;
  gap: 6px;

  .q-btn {
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.q-btn .q-icon,
.q-btn .q-spinner {
  font-size: 20px;
}

@media (max-width: 600px) {
  .container-match {
    padding: 0 8px;
  }

  .round-container {
    padding: 12px 8px;
    border-radius: 12px;
  }

  .round-title {
    font-size: 1.25rem;
    margin-bottom: 12px;
    padding: 8px 0;
  }

  .match-row {
    padding: 8px 0;
    margin-bottom: 6px;
  }

  .match-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
  }

  .match-info {
    font-size: 0.75rem;
    width: 100%;
  }

  .match-actions {
    align-self: flex-end;
    width: 100%;
    justify-content: flex-end;
  }

  .q-btn .q-icon {
    font-size: 18px;
  }
}
</style>
