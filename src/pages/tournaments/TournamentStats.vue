<template>
  <q-page class="tournament-stats-page">
   <div class="text-center q-my-lg">
        <div class="sports-font text-h4">La pizarra <q-icon name="analytics" /></div>
      </div>

    <div class="match-selector-wrapper">
      <q-card class="match-selector-card">
        <q-card-section class="q-pa-xs">
          <div v-if="selectedMatch && !showMatchSelector" class="match-compact">
            <div class="match-info">
              <q-icon name="sports_soccer" color="primary" />
              <div class="match-details">
                <div class="text-h5 text-weight-bold">{{ selectedMatch.homeTeam }} vs {{ selectedMatch.awayTeam }}</div>
                <div class="text-caption text-grey-6">{{ selectedMatch.date }}</div>
              </div>
            </div>
            <q-btn
              outline
              dense
              color="primary"
              label="Cambiar"
              icon-right="sync_alt"
              @click="showMatchSelector = true"
              class="change-btn"
            />
          </div>

          <q-select
            v-else
            v-model="selectedMatch"
            :options="matches"
            option-label="label"
            filled
            label="Seleccione el partido"
            @update:model-value="onMatchChange"
            class="match-select"
            :loading="isLoadingMatches"
            autofocus
          >
            <template #prepend>
              <q-icon name="sports_soccer" color="primary" size="28px" />
            </template>
            <template #selected>
              <div v-if="selectedMatch" class="selected-match">
                <div class="text-weight-bold text-h6">{{ selectedMatch.homeTeam }} vs {{ selectedMatch.awayTeam }}</div>
                <div class="text-caption text-grey-6">{{ selectedMatch.date }}</div>
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
        <q-tab name="analytics" class="modern-tab">
          <div class="tab-content">
            <q-icon name="bar_chart" size="24px" />
            <span v-if="$q.screen.gt.xs">Analytics</span>
          </div>
        </q-tab>
        <q-tab name="clips" class="modern-tab">
          <div class="tab-content">
            <q-icon name="movie" size="24px" />
            <span v-if="$q.screen.gt.xs">Clips</span>
          </div>
        </q-tab>
        <q-tab name="destacados" class="modern-tab">
          <div class="tab-content">
            <q-icon name="star" size="24px" />
            <span v-if="$q.screen.gt.xs">Destacados</span>
          </div>
        </q-tab>
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="tab" animated swipeable>
      <q-tab-panel name="analytics" class="q-pa-none">
        <AnalyticsPanel
          :analytics-data="analyticsData"
          :loading="isLoadingAnalytics"
        />
      </q-tab-panel>

      <q-tab-panel name="clips" class="q-pa-none">
        <ClipsPanel
          :highlights-data="highlightsData"
          :youtube-video-id="youtubeVideoId"
          :var-time="varTime"
          :loading="isLoadingAnalytics"
        />
      </q-tab-panel>

      <q-tab-panel name="destacados" class="q-pa-none">
        <DestacadosPanel
          :player-moments-data="playerMomentsData"
          :youtube-video-id="youtubeVideoId"
          :match-start="matchStart"
          :loading="isLoadingAnalytics"
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useQuasar, Notify } from 'quasar'
import { useTournamentSelection } from '@/composables/useTournamentSelection'
import { useTournamentStore } from '@/stores/tournaments'
import { useMatchStore } from '@/stores/matches'
import { useDatabaseStore } from '@/stores/database'
import { useUserStore } from '@/stores/user'
import { getAllMatchAnalytics, type PlayerMoment, type Highlight } from '@/services/matchAnalyticsService'
import { getMatchMetadata, determineTeamSide } from '@/services/matchMetadataService'
import { getPlayerParticipation } from '@/services/playerParticipationService'
import type { Tournament } from '@/types/auth'
import type { Match } from '@/types/competition'

// Lazy load panels
const AnalyticsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/AnalyticsPanel.vue'))
const ClipsPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/ClipsPanel.vue'))
const DestacadosPanel = defineAsyncComponent(() => import('@/components/tournaments/panels/DestacadosPanel.vue'))

const $q = useQuasar()

// Stores
const tStore = useTournamentStore()
const mStore = useMatchStore()

// State
const tournaments = ref<Tournament[]>([])
const tab = ref<'analytics' | 'clips' | 'destacados'>('analytics')
const isLoadingMatches = ref(false)
const isLoadingAnalytics = ref(false)
const analyticsData = ref<Record<string, unknown> | null>(null)
const youtubeVideoId = ref<string>('DtD7GNuF3xQ') // Default fallback
const matchStart = ref<string>('') // Tiempo de inicio del partido en el video
const varTime = ref<number>(0) // Segundos a restar de cada timecode

// Match selection
interface MatchOption {
  matchId: string
  tournamentId: string
  homeTeam: string
  awayTeam: string
  date: string
  label: string
}

const matches = ref<MatchOption[]>([])
const selectedMatch = ref<MatchOption | null>(null)
const showMatchSelector = ref(false)

// Tournament selection using composable
const { selectedTournament } = useTournamentSelection(tournaments)

// Computed
const tId = computed<string>(() => selectedTournament.value?.tournamentId || '')

const highlightsData = computed(() => {
  if (!analyticsData.value?.data) return undefined
  return (analyticsData.value.data as Record<string, unknown>).highlights
})

const playerMomentsData = computed(() => {
  if (!analyticsData.value?.data) return undefined
  return (analyticsData.value.data as Record<string, unknown>).playerMoments
})

// Functions
async function loadMatches() {
  if (!tId.value) return

  isLoadingMatches.value = true
  try {
    await mStore.fetch(tId.value)

    // Convertir matches a opciones para el selector
    matches.value = mStore.items.map((match: Match) => {
      const homeTeamName = typeof match.homeTeamId === 'string'
        ? match.homeTeamId
        : match.homeTeamId.name || 'Equipo Local'

      const awayTeamName = typeof match.awayTeamId === 'string'
        ? match.awayTeamId
        : match.awayTeamId.name || 'Equipo Visitante'

      const dateStr = match.date
        ? new Date(match.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'Fecha por definir'

      return {
        matchId: match.id,
        tournamentId: match.tournamentId,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        date: dateStr,
        label: `${homeTeamName} vs ${awayTeamName} - ${dateStr}`
      }
    })

    // Auto-seleccionar el primer partido si hay disponibles
    if (matches.value.length > 0 && !selectedMatch.value) {
      const firstMatch = matches.value[0]
      if (firstMatch) {
        selectedMatch.value = firstMatch
        showMatchSelector.value = false
        await loadAnalytics()
      }
    } else if (matches.value.length === 0) {
      showMatchSelector.value = true
    }
  } catch (error) {
    console.error('Error loading matches:', error)
    Notify.create({
      type: 'negative',
      message: 'Error al cargar los partidos',
      position: 'top'
    })
  } finally {
    isLoadingMatches.value = false
  }
}

async function loadAnalytics() {
  if (!selectedMatch.value) return

  const databaseStore = useDatabaseStore()
  const userStore = useUserStore()
  const userRole = databaseStore.userData?.role
  let playerSide: 'home' | 'away' | null = null
  let matchMetadata = null

  // Obtener metadata del partido (necesario para todos los roles)
  matchMetadata = await getMatchMetadata(
    selectedMatch.value.tournamentId,
    selectedMatch.value.matchId
  )

  // Extraer VIDEO_ID si existe
  if (matchMetadata?.VIDEO_ID) {
    youtubeVideoId.value = matchMetadata.VIDEO_ID
    console.log('📹 VIDEO_ID encontrado:', matchMetadata.VIDEO_ID)
  } else {
    // Fallback al valor por defecto
    youtubeVideoId.value = 'DtD7GNuF3xQ'
    console.warn('⚠️ VIDEO_ID no encontrado, usando valor por defecto')
  }

  // Extraer MATCH_START si existe
  if (matchMetadata?.MATCH_START) {
    matchStart.value = matchMetadata.MATCH_START
    console.log('⏱️ MATCH_START encontrado:', matchMetadata.MATCH_START)
  } else {
    matchStart.value = ''
    console.warn('⚠️ MATCH_START no encontrado')
  }

  // Extraer VAR_TIME si existe
  if (matchMetadata?.VAR_TIME !== undefined) {
    varTime.value = matchMetadata.VAR_TIME
    console.log('🔧 VAR_TIME encontrado:', matchMetadata.VAR_TIME, 'segundos')
  } else {
    varTime.value = 0
    console.warn('⚠️ VAR_TIME no encontrado, usando 0')
  }

  // Determinar el lado del jugador si es rol 'player' o 'team'
  if (userRole === 'player' || userRole === 'team') {
    const playerId = userStore.user?.uid

    if (!playerId) {
      analyticsData.value = null
      Notify.create({
        type: 'warning',
        message: 'No se pudo identificar tu usuario',
        position: 'top'
      })
      return
    }

    const participation = await getPlayerParticipation(playerId, tId.value)

    if (!participation) {
      analyticsData.value = null
      Notify.create({
        type: 'warning',
        message: 'No estás registrado en este torneo',
        position: 'top'
      })
      return
    }

    if (!matchMetadata) {
      analyticsData.value = null
      Notify.create({
        type: 'warning',
        message: 'No se encontró información del partido',
        position: 'top'
      })
      return
    }

    playerSide = await determineTeamSide(matchMetadata, participation.teamId)

    if (!playerSide) {
      analyticsData.value = null
      Notify.create({
        type: 'info',
        message: 'Tu equipo no participó en este partido',
        position: 'top'
      })
      return
    }
  }

  isLoadingAnalytics.value = true
  try {
    const data = await getAllMatchAnalytics(
      selectedMatch.value.tournamentId,
      selectedMatch.value.matchId
    )

    // Filtrar según el rol
    if (playerSide) {
      // SOLO mostrar datos del equipo del jugador
      analyticsData.value = {
        tournamentId: selectedMatch.value.tournamentId,
        matchId: selectedMatch.value.matchId,
        [playerSide]: data[playerSide],  // Solo un equipo
        data: {
          playerMoments: data.playerMoments.filter((pm: PlayerMoment) => pm.side === playerSide),
          highlights: data.highlights.filter((h: Highlight) => h.side === playerSide)
        }
      }
    } else {
      // Admins/Managers ven TODOS los equipos
      analyticsData.value = {
        tournamentId: selectedMatch.value.tournamentId,
        matchId: selectedMatch.value.matchId,
        home: data.home,
        away: data.away,
        data: {
          playerMoments: data.playerMoments,
          highlights: data.highlights
        }
      }
    }
  } catch (error) {
    console.error('Error loading analytics:', error)
    Notify.create({
      type: 'warning',
      message: 'No hay datos de analytics disponibles para este partido',
      position: 'top'
    })
    analyticsData.value = null
  } finally {
    isLoadingAnalytics.value = false
  }
}

function onMatchChange(match: MatchOption | null) {
  if (match) {
    selectedMatch.value = match
    showMatchSelector.value = false
    void loadAnalytics()
  }
}

// Lifecycle
onMounted(async () => {
  // Cargar torneos
  await tStore.fetch()
  tournaments.value = tStore.items

  // Si hay un torneo seleccionado, cargar sus partidos
  if (tId.value) {
    await loadMatches()
  }

  // Watch para cambios en el torneo seleccionado
  watch(tId, async (newTId) => {
    if (newTId) {
      // Reset match selection
      selectedMatch.value = null
      showMatchSelector.value = true
      analyticsData.value = null

      // Cargar partidos del nuevo torneo
      await loadMatches()
    }
  }, { immediate: false })
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
.tournament-stats-page {
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

// Match Selector Card
.match-selector-wrapper {
  max-width: 800px;
  margin: 16px 0;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.match-selector-card {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 2px solid #E0E0E0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  // Estilo compacto cuando está seleccionado
  &:has(.match-compact) {
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

.match-select {
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

.selected-match {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

// Modo compacto
.match-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  animation: fadeIn 0.3s ease;
}

.match-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 12px;
}

.match-details {
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

.match-info .q-icon {
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

// Panel Placeholder
.panel-placeholder {
  background: white;
  border-radius: 16px;
  padding: 64px 32px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
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

  .match-selector-card {
    .q-card-section {
      padding: 16px !important;
    }
  }

  .match-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .match-info {
    width: 100%;
  }

  .change-btn {
    width: 100%;
  }

  .modern-tab {
    .tab-content {
      font-size: 0.75rem;
    }
  }

  .panel-placeholder {
    padding: 32px 16px;
    min-height: 300px;
  }
}
</style>
