<template>
  <div class="analytics-panel">
    <div v-if="showTeamSelector" class="team-selector-wrapper">
      <q-card class="team-selector-card">
        <q-card-section class="q-pa-md">
          <div class="selector-content">
            <q-btn-toggle
              v-model="selectedTeam"
              toggle-color="primary"
              :options="teamOptions"
              class="team-toggle"
              unelevated
              spread
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="loading" class="loading-container">
      <q-spinner-dots color="primary" size="50px" />
      <p class="text-grey-6">Cargando analytics...</p>
    </div>

    <div v-else-if="!hasRealData" class="no-data-container">
      <q-card class="no-data-card">
        <q-card-section class="text-center q-pa-xl">
          <q-icon name="analytics" size="120px" color="grey-4" class="q-mb-lg" />
          <h5 class="text-h5 text-weight-bold q-mb-md text-grey-7">
            No hay datos disponibles
          </h5>
          <p class="text-body1 text-grey-6 q-mb-md">
            Aún no se han procesado las analíticas para este partido.
          </p>
          <p class="text-body2 text-grey-5">
            Los datos de analytics estarán disponibles una vez que el partido haya sido procesado.
          </p>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="analytics-content">
      <div class="stats-section">
        <h5 class="section-title">
          <q-icon name="bar_chart" size="24px" />
          Estadísticas Generales
        </h5>
        <div class="stats-grid">
          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="sports_soccer" size="32px" color="positive" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.goals }}</div>
              <div class="stat-label">Goles</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="track_changes" size="32px" color="primary" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.shots }}</div>
              <div class="stat-label">Tiros</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="gps_fixed" size="32px" color="warning" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.shotsOnTarget }}</div>
              <div class="stat-label">Tiros a puerta</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="percent" size="32px" color="info" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.conversionRate }}</div>
              <div class="stat-label">Conversión</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="flag" size="32px" color="orange" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.corners }}</div>
              <div class="stat-label">Saque de esquina</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="sports" size="32px" color="deep-orange" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.freeKicks }}</div>
              <div class="stat-label">Tiro libre</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="timer" size="32px" color="teal" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.possession }}</div>
              <div class="stat-label">Posesión</div>
            </q-card-section>
          </q-card>

          <q-card class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="outlined_flag" size="32px" color="red" class="q-mb-sm" />
              <div class="stat-value">{{ currentStats.penalties }}</div>
              <div class="stat-label">Penalti</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="location-section">
        <h5 class="section-title">
          <q-icon name="place" size="24px" />
          Mapa de Ubicación
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <div class="period-selector">
              <q-btn-toggle
                v-model="selectedLocationMapPeriod"
                :options="periodOptions"
                toggle-color="primary"
                size="sm"
                unelevated
              />
            </div>

            <div class="location-grid">
              <div class="location-item">
                <div class="location-header">
                  <q-icon name="shield" size="24px" color="negative" />
                  <span class="location-title">Zona Defensiva</span>
                </div>
                <div class="location-stats">
                  <div class="location-stat">
                    <span class="stat-label-small">Pases</span>
                    <span class="stat-value-large">{{ currentLocationMap.defensive_passes }}</span>
                  </div>
                  <div class="location-stat">
                    <span class="stat-label-small">Posesión</span>
                    <span class="stat-value-large">{{ currentLocationMap.defensive_possession }}</span>
                  </div>
                </div>
              </div>

              <div class="location-item">
                <div class="location-header">
                  <q-icon name="legend_toggle" size="24px" color="warning" />
                  <span class="location-title">Zona Media</span>
                </div>
                <div class="location-stats">
                  <div class="location-stat">
                    <span class="stat-label-small">Pases</span>
                    <span class="stat-value-large">{{ currentLocationMap.middle_passes }}</span>
                  </div>
                  <div class="location-stat">
                    <span class="stat-label-small">Posesión</span>
                    <span class="stat-value-large">{{ currentLocationMap.middle_possession }}</span>
                  </div>
                </div>
              </div>

              <div class="location-item">
                <div class="location-header">
                  <q-icon name="sports_score" size="24px" color="positive" />
                  <span class="location-title">Zona Ofensiva</span>
                </div>
                <div class="location-stats">
                  <div class="location-stat">
                    <span class="stat-label-small">Pases</span>
                    <span class="stat-value-large">{{ currentLocationMap.attacking_passes }}</span>
                  </div>
                  <div class="location-stat">
                    <span class="stat-label-small">Posesión</span>
                    <span class="stat-value-large">{{ currentLocationMap.attacking_possession }}</span>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="shot-map-section">
        <h5 class="section-title">
          <q-icon name="gps_fixed" size="24px" />
          Mapa de Tiros
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <div class="period-selector">
              <q-btn-toggle
                v-model="selectedShotMapPeriod"
                :options="periodOptions"
                toggle-color="primary"
                size="sm"
                unelevated
              />
            </div>

            <div class="shot-map-grid">
              <div class="shot-map-stat">
                <q-icon name="sports_soccer" size="32px" color="positive" />
                <div class="shot-map-info">
                  <div class="shot-map-value">{{ currentShotMap.goals }} goles</div>
                  <div class="shot-map-label">de {{ currentShotMap.total }} intentos</div>
                </div>
              </div>

              <div class="shot-map-stat">
                <q-icon name="crop_square" size="32px" color="primary" />
                <div class="shot-map-info">
                  <div class="shot-map-value">{{ currentShotMap.insideBox }}</div>
                  <div class="shot-map-label">dentro del área</div>
                </div>
              </div>

              <div class="shot-map-stat">
                <q-icon name="open_in_full" size="32px" color="info" />
                <div class="shot-map-info">
                  <div class="shot-map-value">{{ currentShotMap.outsideBox }}</div>
                  <div class="shot-map-label">fuera del área</div>
                </div>
              </div>
            </div>

            <div v-if="currentShotMap.screenshot" class="shot-map-image">
              <q-img
                :src="currentShotMap.screenshot"
                :ratio="16/9"
                fit="contain"
                class="rounded-borders"
                style="min-height: 100px; max-height: 200px;"
              >
                <template #error>
                  <div class="absolute-full flex flex-center bg-grey-3 flex-column">
                    <q-icon name="broken_image" size="64px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">Error al cargar la imagen</p>
                    <small class="text-grey-5">{{ currentShotMap.screenshot }}</small>
                  </div>
                </template>
                <template #loading>
                  <div class="absolute-full flex flex-center bg-grey-2">
                    <q-spinner color="primary" size="50px" />
                    <p class="q-ml-md text-grey-7">Cargando imagen...</p>
                  </div>
                </template>
              </q-img>
            </div>
            <div v-else class="shot-map-placeholder">
              <q-icon name="image" size="64px" color="grey-4" />
              <p class="text-grey-6">Mapa de tiros no disponible</p>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="heat-map-section">
        <h5 class="section-title">
          <q-icon name="thermostat" size="24px" />
          Mapa de Calor
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <div class="heat-map-selector">
              <q-btn-toggle
                v-model="selectedPeriod"
                :options="periodOptions"
                toggle-color="primary"
                size="sm"
                unelevated
              />
            </div>

            <div v-if="currentHeatMap.screenshot" class="heat-map-image">
              <q-img
                :src="currentHeatMap.screenshot"
                :ratio="16/9"
                fit="contain"
                class="rounded-borders"
                style="min-height: 100px; max-height: 200px;"
              >
                <template #error>
                  <div class="absolute-full flex flex-center bg-grey-3 flex-column">
                    <q-icon name="broken_image" size="64px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">Error al cargar la imagen</p>
                    <small class="text-grey-5">{{ currentHeatMap.screenshot }}</small>
                  </div>
                </template>
                <template #loading>
                  <div class="absolute-full flex flex-center bg-grey-2">
                    <q-spinner color="primary" size="50px" />
                    <p class="q-ml-md text-grey-7">Cargando imagen...</p>
                  </div>
                </template>
              </q-img>
            </div>
            <div v-else class="heat-map-placeholder">
              <q-icon name="image" size="64px" color="grey-4" />
              <p class="text-grey-6">Mapa de calor no disponible</p>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="passes-section">
        <h5 class="section-title">
          <q-icon name="timeline" size="24px" />
          Secuencias de Pases
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <div class="period-selector">
              <q-btn-toggle
                v-model="selectedPassesPeriod"
                :options="periodOptions"
                toggle-color="primary"
                size="sm"
                unelevated
              />
            </div>

            <div class="passes-stats-grid">
              <div class="passes-stat-card">
                <div class="passes-stat-value">{{ currentPassesStrings.stat_3to5 }}</div>
                <div class="passes-stat-label">Secuencias de 3-5 pases</div>
              </div>
              <div class="passes-stat-card">
                <div class="passes-stat-value">{{ currentPassesStrings.stat_6ormore }}</div>
                <div class="passes-stat-label">Secuencias de 6+ pases</div>
              </div>
              <div class="passes-stat-card">
                <div class="passes-stat-value">{{ currentPassesStrings.stat_longest }}</div>
                <div class="passes-stat-label">Secuencia más larga</div>
              </div>
            </div>

            <div class="passes-chart">
              <div class="passes-chart-title">Distribución de secuencias</div>
              <div class="passes-bars">
                <div
                  v-for="(bar, index) in currentPassesStrings.bars"
                  :key="index"
                  class="passes-bar-wrapper"
                >
                  <div
                    class="passes-bar"
                    :style="{ height: `${(bar / maxBarValue) * 100}%` }"
                  >
                    <span class="passes-bar-value">{{ bar }}</span>
                  </div>
                  <div class="passes-bar-label">{{ currentPassesStrings.xAxisLabels[index] }}</div>
                </div>
              </div>
              <div class="passes-chart-footer">Número de pases conectados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import storageService from '@/services/storageService'

// Props
interface Props {
  analyticsData?: Record<string, unknown> | null
  loading?: boolean
  teamId?: string // ID del equipo actual (para filtrar datos)
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Computed: Extraer equipos y datos desde analyticsData REAL de Firestore
const hasRealData = computed(() => {
  return props.analyticsData &&
         typeof props.analyticsData === 'object' &&
         ('home' in props.analyticsData || 'away' in props.analyticsData)
})

// Función helper para extraer nombre de equipo
function getTeamName(side: 'home' | 'away'): string {
  if (!props.analyticsData || typeof props.analyticsData !== 'object') return side === 'home' ? 'Local' : 'Visitante'

  const sideData = props.analyticsData[side] as Record<string, unknown>
  if (!sideData) return side === 'home' ? 'Local' : 'Visitante'

  // Intentar obtener el nombre del equipo desde stats
  const stats = sideData.stats as { team?: string } | null
  if (stats?.team) return stats.team

  // Intentar desde shotMap
  const shotMap = sideData.shotMap as { team?: string } | null
  if (shotMap?.team) return shotMap.team

  // Intentar desde heatMap
  const heatMap = sideData.heatMap as { team?: string } | null
  if (heatMap?.team) return heatMap.team

  return side === 'home' ? 'Local' : 'Visitante'
}

// State
const selectedTeam = ref<'home' | 'away'>('home')
const selectedPeriod = ref<'Full recording' | '1st period' | '2nd period'>('1st period')
const selectedLocationMapPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')
const selectedShotMapPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')
const selectedPassesPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')

// Computed: Extraer equipos disponibles desde datos reales de Firestore
const availableTeams = computed(() => {
  if (!hasRealData.value) {
    // NO mostrar datos mockeados si no hay datos reales
    return []
  }

  const teams: Array<{ label: string; value: 'home' | 'away' }> = []

  // Extraer equipo home
  if (props.analyticsData && 'home' in props.analyticsData) {
    const homeName = getTeamName('home')
    teams.push({ label: homeName, value: 'home' })
  }

  // Extraer equipo away
  if (props.analyticsData && 'away' in props.analyticsData) {
    const awayName = getTeamName('away')
    teams.push({ label: awayName, value: 'away' })
  }

  return teams
})

// Team options for toggle
const teamOptions = computed(() => availableTeams.value)

// Computed: Mostrar selector solo si hay más de un equipo Y no hay teamId filtrado
const showTeamSelector = computed(() => {
  return !props.teamId && availableTeams.value.length > 1
})

// Period options for all sections
const periodOptions = [
  { label: 'Completo', value: 'Full recording' },
  { label: '1er Tiempo', value: '1st period' },
  { label: '2do Tiempo', value: '2nd period' }
]

// Tipos para las computed properties
interface StatsData {
  goals: string | number
  shots: string | number
  shotsOnTarget: string | number
  conversionRate: string
  corners: string | number
  freeKicks: string | number
  possession: string | number
  penalties: string | number
}

interface LocationMapDataType {
  defensive_passes: string
  middle_passes: string
  attacking_passes: string
  defensive_possession: string
  middle_possession: string
  attacking_possession: string
}

interface ShotMapDataType {
  goals?: string
  shots?: string
  total?: string
  insideBox?: string
  outsideBox?: string
  conversionRate?: string
  screenshot?: string
}

interface HeatMapDataType {
  screenshot?: string
}

interface PassesStringsDataType {
  xAxisLabels: string[]
  bars: number[]
  stat_3to5: string
  stat_6ormore: string
  stat_longest: string
}

const currentStats = computed<StatsData>(() => {
  if (hasRealData.value && props.analyticsData) {
    const sideData = props.analyticsData[selectedTeam.value] as Record<string, unknown> | undefined

    if (sideData?.stats) {
      const statsData = sideData.stats as { data?: Array<{ name: string; home: string | number; away: string | number }> }

      if (statsData.data) {
        const side = selectedTeam.value

         const goalsData = statsData.data.find(s => s.name.toLowerCase().includes('gol'))
        const shotsData = statsData.data.find(s => s.name.toLowerCase().includes('tiro') && !s.name.toLowerCase().includes('libre'))
        const occasionsData = statsData.data.find(s => s.name.toLowerCase().includes('ocasiones'))
        const cornersData = statsData.data.find(s => s.name.toLowerCase().includes('esquina'))
        const freeKicksData = statsData.data.find(s => s.name.toLowerCase().includes('libre'))
        const possessionData = statsData.data.find(s => s.name.toLowerCase().includes('posesión'))
        const penaltiesData = statsData.data.find(s => s.name.toLowerCase().includes('penalti'))

        const result = {
          goals: goalsData?.[side] || 0,
          shots: shotsData?.[side] || 0,
          shotsOnTarget: occasionsData?.[side] || 0,
          conversionRate: '0%',
          corners: cornersData?.[side] || 0,
          freeKicks: freeKicksData?.[side] || 0,
          possession: possessionData?.[side] || '-',
          penalties: penaltiesData?.[side] || 0
        }
        return result
      }
    }
  }

  return {
    goals: '-',
    shots: '-',
    shotsOnTarget: '-',
    conversionRate: '-',
    corners: '-',
    freeKicks: '-',
    possession: '-',
    penalties: '-'
  }
})

const currentLocationMap = computed<LocationMapDataType>(() => {
  if (hasRealData.value && props.analyticsData) {
    const sideData = props.analyticsData[selectedTeam.value] as Record<string, unknown> | undefined

    if (sideData?.locationMap) {
      const locationMapArray = sideData.locationMap as unknown[]

      // Mapear período a índice: 0 = Full recording, 1 = 1st period, 2 = 2nd period
      const periodIndex = selectedLocationMapPeriod.value === 'Full recording' ? 0 :
                         selectedLocationMapPeriod.value === '1st period' ? 1 : 2

      if (Array.isArray(locationMapArray) && locationMapArray[periodIndex]) {
        const result = locationMapArray[periodIndex] as LocationMapDataType
        return result
      }
    }
  }

  // Si no hay datos, retornar valores vacíos
  return {
    defensive_passes: '-',
    middle_passes: '-',
    attacking_passes: '-',
    defensive_possession: '-',
    middle_possession: '-',
    attacking_possession: '-'
  }
})

const currentShotMap = computed<ShotMapDataType>(() => {
  // SOLO usar datos reales de Firestore
  if (hasRealData.value && props.analyticsData) {
    const sideData = props.analyticsData[selectedTeam.value] as Record<string, unknown> | undefined

    if (sideData?.shotMap) {
      const shotMapData = sideData.shotMap as { data?: unknown[] }

      if (Array.isArray(shotMapData.data)) {
        // Mapear período a índice: 0 = Full recording, 1 = 1st period, 2 = 2nd period
        const periodIndex = selectedShotMapPeriod.value === 'Full recording' ? 0 :
                           selectedShotMapPeriod.value === '1st period' ? 1 : 2

        const periodData = shotMapData.data[periodIndex] as ShotMapDataType | undefined

        if (periodData) {
          const rawData = periodData as Record<string, unknown>

          // Extraer valores
          const goals = rawData.goals as string || '-'
          const shots = rawData.shots as string || '-'
          const total = rawData.total as string || '-'
          const conversionRate = rawData.conversionRate as string || '-'

          // Calcular insideBox y outsideBox desde los porcentajes
          let insideBox = '-'
          let outsideBox = '-'

          const insideBoxText = rawData.insideBox3 as string
          const outsideBoxText = rawData.insideBox4 as string

          if (insideBoxText && outsideBoxText && total !== '-') {
            // Extraer porcentaje de "43% of total attempts inside box."
            const insideMatch = insideBoxText.match(/(\d+)%/)
            const outsideMatch = outsideBoxText.match(/(\d+)%/)

            if (insideMatch?.[1] && outsideMatch?.[1]) {
              const totalNum = parseInt(total)
              const insidePercent = parseInt(insideMatch[1])
              const outsidePercent = parseInt(outsideMatch[1])

              insideBox = Math.round(totalNum * insidePercent / 100).toString()
              outsideBox = Math.round(totalNum * outsidePercent / 100).toString()
            }
          }

          // Convert screenshot if exists
          let screenshot: string | undefined
          if (rawData.screenshot && typeof rawData.screenshot === 'string') {
            screenshot = storageService.isGsUrl(rawData.screenshot)
              ? storageService.convertGsUrlToHttps(rawData.screenshot)
              : rawData.screenshot
          }

          // Build result without adding screenshot: undefined property (only add when defined)
          const result: ShotMapDataType = {
            goals,
            shots,
            total,
            insideBox,
            outsideBox,
            conversionRate
          }

          if (screenshot) {
            result.screenshot = screenshot
          }

          return result
        }
      }
    }
  }

  // Si no hay datos, retornar valores vacíos (omitir screenshot para cumplir con exactOptionalPropertyTypes)
  return {
    goals: '-',
    shots: '-',
    total: '-',
    insideBox: '-',
    outsideBox: '-',
    conversionRate: '-'
  }
})

const currentHeatMap = computed<HeatMapDataType>(() => {
  // SOLO usar datos reales de Firestore
  if (hasRealData.value && props.analyticsData) {
    const sideData = props.analyticsData[selectedTeam.value] as Record<string, unknown> | undefined
    if (sideData?.heatMap) {
      const heatMapData = sideData.heatMap as { data?: unknown[] }

      if (Array.isArray(heatMapData.data)) {
        // Mapear período a índice: 0 = Full recording, 1 = 1st period, 2 = 2nd period
        const periodIndex = selectedPeriod.value === 'Full recording' ? 2 :
                           selectedPeriod.value === '1st period' ? 0 : 1

        const periodData = heatMapData.data[periodIndex] as HeatMapDataType | undefined

        if (periodData) {
          // Always convert screenshot if it exists
          if (periodData.screenshot && typeof periodData.screenshot === 'string') {
            const convertedScreenshot = storageService.isGsUrl(periodData.screenshot)
              ? storageService.convertGsUrlToHttps(periodData.screenshot)
              : periodData.screenshot

            return {
              screenshot: convertedScreenshot
            }
          }

          return periodData
        }
      }
    }
  }

  // Si no hay datos, retornar objeto vacío (omitir screenshot para cumplir con exactOptionalPropertyTypes)
  return {}
})

const currentPassesStrings = computed<PassesStringsDataType>(() => {
  // SOLO usar datos reales de Firestore
  if (hasRealData.value && props.analyticsData) {
    const sideData = props.analyticsData[selectedTeam.value] as Record<string, unknown> | undefined
    if (sideData?.passesStrings) {
      const passesData = sideData.passesStrings as { data?: unknown[] }

      if (Array.isArray(passesData.data)) {
        // Mapear período a índice: 0 = Full recording, 1 = 1st period, 2 = 2nd period
        const periodIndex = selectedPassesPeriod.value === 'Full recording' ? 0 :
                           selectedPassesPeriod.value === '1st period' ? 1 : 2

        const periodData = passesData.data[periodIndex] as PassesStringsDataType | undefined

        if (periodData) {
          return periodData
        }
      }
    }
  }

  // Si no hay datos, retornar valores vacíos
  return {
    xAxisLabels: [],
    bars: [],
    stat_3to5: '-',
    stat_6ormore: '-',
    stat_longest: '-'
  }
})

// Max bar value for chart scaling
const maxBarValue = computed(() => {
  if (currentPassesStrings.value.bars.length === 0) return 1
  return Math.max(...currentPassesStrings.value.bars)
})

// Watch para cuando lleguen datos reales desde Firestore
watch(() => props.analyticsData, (newData) => {
  if (newData) {
    // Auto-seleccionar primer equipo disponible si hay datos
    if (availableTeams.value.length > 0 && availableTeams.value[0]) {
      const firstTeam = availableTeams.value[0].value
      if (firstTeam === 'home' || firstTeam === 'away') {
        selectedTeam.value = firstTeam
      }
    }
  }
}, { deep: true, immediate: true })

// Watch para filtrar por teamId si se proporciona
watch(() => props.teamId, (newTeamId) => {
  if (newTeamId) {
    // Convertir teamId a 'home' o 'away' si es necesario
    // Por ahora asumimos que teamId ya viene como 'home' o 'away'
    if (newTeamId === 'home' || newTeamId === 'away') {
      selectedTeam.value = newTeamId
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.analytics-panel {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

// Team Selector
.team-selector-wrapper {
  margin-bottom: 24px;
}

.team-selector-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.selector-content {
  display: flex;
  justify-content: center;
}

.team-toggle {
  width: 100%;
  max-width: 500px;

  :deep(.q-btn) {
    font-weight: 600;
    font-size: 1rem;
    padding: 12px 24px;
  }
}

// Loading
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  gap: 16px;
}

// No Data State
.no-data-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 32px 16px;
}

.no-data-card {
  max-width: 600px;
  width: 100%;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px dashed #E0E0E0;

  .q-icon {
    opacity: 0.6;
  }

  h5 {
    margin: 0;
  }

  p {
    margin: 0;
  }
}

// Content
.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Section Title
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #064F34;
  margin: 0 0 16px 0;
  padding-left: 4px;
}

// Stats Cards
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 200px);
  gap: 16px;
  justify-content: center;
}

.stat-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width: 200px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #064F34;
  line-height: 1;
  margin: 8px 0;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

// Data Card
.data-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

// Location Map
.location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.location-item {
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%);
  border: 2px solid #E0E0E0;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.location-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.location-stats {
  display: flex;
  gap: 24px;
}

.location-stat {
  flex: 1;
  text-align: center;
}

.stat-label-small {
  display: block;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-weight: 600;
}

.stat-value-large {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #064F34;
}

// Shot Map
.shot-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.shot-map-stat {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #F5F7FA;
}

.shot-map-info {
  flex: 1;
}

.shot-map-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #064F34;
}

.shot-map-label {
  font-size: 0.85rem;
  color: #666;
}

.shot-map-image,
.heat-map-image {
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
}

// Period Selector (common for all sections)
.period-selector {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

// Heat Map
.heat-map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background: #F5F7FA;
  border-radius: 12px;
  gap: 16px;
}

// Shot Map Placeholder
.shot-map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background: #F5F7FA;
  border-radius: 12px;
  gap: 16px;
  margin-top: 16px;
}

// Passes Strings
.passes-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.passes-stat-card {
  padding: 20px;
  background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
  border-radius: 12px;
  text-align: center;
  color: white;
}

.passes-stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.passes-stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

// Passes Chart
.passes-chart {
  padding: 24px;
  background: #F5F7FA;
  border-radius: 12px;
}

.passes-chart-title {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: #333;
  margin-bottom: 24px;
}

.passes-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 150px;
  padding: 0 16px;
  gap: 8px;
}

.passes-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.passes-bar {
  width: 100%;
  max-width: 60px;
  background: linear-gradient(180deg, #064F34 0%, #138A59 100%);
  border-radius: 8px 8px 0 0;
  position: relative;
  min-height: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(180deg, #138A59 0%, #1AAF6E 100%);
    transform: scaleY(1.05);
  }
}

.passes-bar-value {
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
}

.passes-bar-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.passes-chart-footer {
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  margin-top: 16px;
  font-weight: 600;
}

// Responsive
@media (max-width: 768px) {
  .analytics-panel {
    padding: 8px;
  }

  .team-toggle {
    :deep(.q-btn) {
      font-size: 0.85rem;
      padding: 8px 16px;
    }
  }

  .no-data-container {
    min-height: 50vh;
    padding: 24px 12px;
  }

  .no-data-card {
    .q-icon {
      font-size: 80px !important;
    }

    h5 {
      font-size: 1.25rem;
    }

    p {
      font-size: 0.9rem;
    }
  }

  .section-title {
    font-size: 1.1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 100px);
    gap: 8px;
  }

  .stat-card {
    width: 100px;

    .q-icon {
      font-size: 24px !important;
    }
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .location-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .shot-map-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .passes-bars {
    height: 200px;
    padding: 0 8px;
    gap: 4px;
  }

  .passes-bar {
    max-width: 40px;
  }

  .passes-bar-value {
    font-size: 0.75rem;
  }

  .passes-bar-label {
    font-size: 0.7rem;
  }
}
</style>
