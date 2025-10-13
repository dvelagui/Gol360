<template>
  <div class="analytics-panel">
    <!-- Team Selector -->
    <div class="team-selector-wrapper">
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

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots color="primary" size="50px" />
      <p class="text-grey-6">Cargando analytics...</p>
    </div>

    <!-- Content -->
    <div v-else class="analytics-content">
      <!-- Stats Cards -->
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
        </div>
      </div>

      <!-- Location Map -->
      <div class="location-section">
        <h5 class="section-title">
          <q-icon name="place" size="24px" />
          Mapa de Ubicación
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <!-- Period Selector -->
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

      <!-- Shot Map -->
      <div class="shot-map-section">
        <h5 class="section-title">
          <q-icon name="gps_fixed" size="24px" />
          Mapa de Tiros
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <!-- Period Selector -->
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

            <!-- Shot Map Image -->
            <div v-if="currentShotMap.screenshot" class="shot-map-image">
              <div class="debug-info">
                <small>URL: {{ currentShotMap.screenshot }}</small>
              </div>
              <q-img
                :src="currentShotMap.screenshot"
                ratio="16/9"
                fit="contain"
                class="rounded-borders"
                @error="(err) => console.error('Shot map image error:', err, currentShotMap.screenshot)"
                @load="() => console.log('Shot map image loaded:', currentShotMap.screenshot)"
              >
                <template #error>
                  <div class="absolute-full flex flex-center bg-grey-3 flex-column">
                    <q-icon name="broken_image" size="64px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">Error al cargar la imagen</p>
                    <small class="text-grey-5">{{ currentShotMap.screenshot }}</small>
                  </div>
                </template>
                <template #loading>
                  <div class="absolute-full flex flex-center">
                    <q-spinner color="primary" size="50px" />
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

      <!-- Heat Map -->
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
              <div class="debug-info">
                <small>URL: {{ currentHeatMap.screenshot }}</small>
              </div>
              <q-img
                :src="currentHeatMap.screenshot"
                ratio="16/9"
                fit="contain"
                class="rounded-borders"
                @error="(err) => console.error('Heat map image error:', err, currentHeatMap.screenshot)"
                @load="() => console.log('Heat map image loaded:', currentHeatMap.screenshot)"
              >
                <template #error>
                  <div class="absolute-full flex flex-center bg-grey-3 flex-column">
                    <q-icon name="broken_image" size="64px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">Error al cargar la imagen</p>
                    <small class="text-grey-5">{{ currentHeatMap.screenshot }}</small>
                  </div>
                </template>
                <template #loading>
                  <div class="absolute-full flex flex-center">
                    <q-spinner color="primary" size="50px" />
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

      <!-- Passes Strings -->
      <div class="passes-section">
        <h5 class="section-title">
          <q-icon name="timeline" size="24px" />
          Secuencias de Pases
        </h5>
        <q-card class="data-card">
          <q-card-section>
            <!-- Period Selector -->
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

            <!-- Simple bar chart visualization -->
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
import { ref, computed, watch, onMounted } from 'vue'
import storageService from '@/services/storageService'

// Props
interface Props {
  analyticsData: any // TODO: Usar tipo AnalyticsResponse cuando llegue la data real
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// State para URLs de imágenes convertidas
const imageUrls = ref<{
  heatMap: {
    [team: string]: {
      [period: string]: string | null
    }
  }
  shotMap: {
    [team: string]: {
      [period: string]: string | null
    }
  }
}>({
  heatMap: {
    ColoColo: {
      'Full recording': null,
      '1st period': null,
      '2nd period': null
    },
    IndValle: {
      'Full recording': null,
      '1st period': null,
      '2nd period': null
    }
  },
  shotMap: {
    ColoColo: {
      'Full recording': null,
      '1st period': null,
      '2nd period': null
    },
    IndValle: {
      'Full recording': null,
      '1st period': null,
      '2nd period': null
    }
  }
})

const loadingImages = ref(false)

// DATOS MOCK - Estos se reemplazarán con datos reales de la API
const mockData = {
  ColoColo: {
    stats: {
      goals: 3,
      shots: 15,
      shotsOnTarget: 8,
      conversionRate: '17%'
    },
    locationMap: {
      'Full recording': {
        defensive_passes: '2%',
        middle_passes: '92%',
        attacking_passes: '6%',
        defensive_possession: '31%',
        middle_possession: '53%',
        attacking_possession: '15%'
      },
      '1st period': {
        defensive_passes: '3%',
        middle_passes: '86%',
        attacking_passes: '11%',
        defensive_possession: '42%',
        middle_possession: '42%',
        attacking_possession: '15%'
      },
      '2nd period': {
        defensive_passes: '2%',
        middle_passes: '96%',
        attacking_passes: '2%',
        defensive_possession: '22%',
        middle_possession: '63%',
        attacking_possession: '15%'
      }
    },
    shotMap: {
      'Full recording': {
        goals: '3',
        shots: '15',
        total: '18',
        insideBox: '39%',
        outsideBox: '61%',
        conversionRate: '17%',
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/shot_map_Full_recording.png'
      },
      '1st period': {
        goals: '1',
        shots: '5',
        total: '6',
        insideBox: '33%',
        outsideBox: '67%',
        conversionRate: '17%',
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/shot_map_1st_period.png'
      },
      '2nd period': {
        goals: '2',
        shots: '10',
        total: '12',
        insideBox: '42%',
        outsideBox: '58%',
        conversionRate: '17%',
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/shot_map_2nd_period.png'
      }
    },
    heatMap: {
      '1st period': {
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_1st_period.png'
      },
      '2nd period': {
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_2nd_period.png'
      },
      'Full recording': {
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_Full_recording.png'
      }
    },
    passesStrings: {
      'Full recording': {
        xAxisLabels: ['3', '4', '5', '6', '7', '8', '9', '+10'],
        bars: [19, 14, 5, 2, 2, 0, 0, 0],
        stat_3to5: '38',
        stat_6ormore: '4',
        stat_longest: '7'
      },
      '1st period': {
        xAxisLabels: ['3', '4', '5', '6', '7', '8', '9', '+10'],
        bars: [9, 7, 1, 1, 0, 0, 0, 0],
        stat_3to5: '17',
        stat_6ormore: '1',
        stat_longest: '6'
      },
      '2nd period': {
        xAxisLabels: ['3', '4', '5', '6', '7', '8', '9', '+10'],
        bars: [10, 7, 4, 1, 2, 0, 0, 0],
        stat_3to5: '21',
        stat_6ormore: '3',
        stat_longest: '7'
      }
    }
  },
  IndValle: {
    stats: {
      goals: 4,
      shots: 15,
      shotsOnTarget: 9,
      conversionRate: '21%'
    },
    locationMap: {
      'Full recording': {
        defensive_passes: '3%',
        middle_passes: '91%',
        attacking_passes: '6%',
        defensive_possession: '22%',
        middle_possession: '54%',
        attacking_possession: '25%'
      },
      '1st period': {
        defensive_passes: '3%',
        middle_passes: '91%',
        attacking_passes: '7%',
        defensive_possession: '15%',
        middle_possession: '60%',
        attacking_possession: '26%'
      },
      '2nd period': {
        defensive_passes: '4%',
        middle_passes: '92%',
        attacking_passes: '5%',
        defensive_possession: '30%',
        middle_possession: '46%',
        attacking_possession: '24%'
      }
    },
    shotMap: {
      'Full recording': {
        goals: '4',
        shots: '15',
        total: '19',
        insideBox: '24%',
        outsideBox: '76%',
        conversionRate: '21%',
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/IndValle/shot_map_Full_recording.png'
      },
      '1st period': {
        goals: '3',
        shots: '11',
        total: '14',
        insideBox: '17%',
        outsideBox: '83%',
        conversionRate: '21%',
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/IndValle/shot_map_1st_period.png'
      },
      '2nd period': {
        goals: '1',
        shots: '4',
        total: '5',
        insideBox: '40%',
        outsideBox: '60%',
        conversionRate: '20%',
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/IndValle/shot_map_2nd_period.png'
      }
    },
    heatMap: {
      '1st period': {
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/IndValle/heat_map_1st_period.png'
      },
      '2nd period': {
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/IndValle/heat_map_2nd_period.png'
      },
      'Full recording': {
        screenshot: 'gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/IndValle/heat_map_Full_recording.png'
      }
    },
    passesStrings: {
      'Full recording': {
        xAxisLabels: ['3', '4', '5', '6', '7', '8', '9', '+10'],
        bars: [16, 11, 7, 3, 1, 1, 0, 0],
        stat_3to5: '34',
        stat_6ormore: '5',
        stat_longest: '8'
      },
      '1st period': {
        xAxisLabels: ['3', '4', '5', '6', '7', '8', '9', '+10'],
        bars: [8, 6, 4, 2, 1, 0, 0, 0],
        stat_3to5: '18',
        stat_6ormore: '3',
        stat_longest: '7'
      },
      '2nd period': {
        xAxisLabels: ['3', '4', '5', '6', '7', '8', '9', '+10'],
        bars: [8, 5, 3, 1, 0, 1, 0, 0],
        stat_3to5: '16',
        stat_6ormore: '2',
        stat_longest: '8'
      }
    }
  }
}

// State
const selectedTeam = ref<'ColoColo' | 'IndValle'>('ColoColo')
const selectedPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')
const selectedLocationMapPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')
const selectedShotMapPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')
const selectedPassesPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')

// Team options for toggle
const teamOptions = [
  { label: 'Colo Colo', value: 'ColoColo' },
  { label: 'Ind. Valle', value: 'IndValle' }
]

// Period options for heat map
const periodOptions = [
  { label: 'Completo', value: 'Full recording' },
  { label: '1er Tiempo', value: '1st period' },
  { label: '2do Tiempo', value: '2nd period' }
]

// Computed properties para datos actuales
const currentStats = computed(() => mockData[selectedTeam.value].stats)
const currentLocationMap = computed(() => mockData[selectedTeam.value].locationMap[selectedLocationMapPeriod.value])
const currentShotMap = computed(() => {
  const shotMap = mockData[selectedTeam.value].shotMap[selectedShotMapPeriod.value]
  // Usar URL convertida si existe
  const convertedScreenshot = imageUrls.value.shotMap[selectedTeam.value]?.[selectedShotMapPeriod.value]
  return {
    ...shotMap,
    screenshot: convertedScreenshot || shotMap.screenshot
  }
})
const currentHeatMap = computed(() => {
  const heatMap = mockData[selectedTeam.value].heatMap[selectedPeriod.value]
  // Usar URL convertida si existe
  const convertedScreenshot = imageUrls.value.heatMap[selectedTeam.value]?.[selectedPeriod.value]
  return {
    ...heatMap,
    screenshot: convertedScreenshot || heatMap.screenshot
  }
})
const currentPassesStrings = computed(() => mockData[selectedTeam.value].passesStrings[selectedPassesPeriod.value])

// Max bar value for chart scaling
const maxBarValue = computed(() => Math.max(...currentPassesStrings.value.bars))

// Función para convertir URLs gs:// a HTTPS
async function convertImageUrls() {
  loadingImages.value = true
  console.log('🔄 Starting image URL conversion...')
  try {
    // Convertir heat maps
    for (const team of ['ColoColo', 'IndValle']) {
      for (const period of ['Full recording', '1st period', '2nd period']) {
        const gsUrl = mockData[team as keyof typeof mockData].heatMap[period as keyof typeof mockData.ColoColo.heatMap]?.screenshot
        console.log(`📍 Processing heat map: ${team} - ${period}`, gsUrl)
        if (gsUrl && storageService.isGsUrl(gsUrl)) {
          try {
            const httpsUrl = await storageService.convertGsUrlToHttps(gsUrl)
            if (!imageUrls.value.heatMap[team]) {
              imageUrls.value.heatMap[team] = {}
            }
            imageUrls.value.heatMap[team][period] = httpsUrl
            console.log(`✅ Converted heat map URL for ${team} ${period}:`, httpsUrl)
          } catch (error) {
            console.error(`❌ Failed to convert heat map URL for ${team} ${period}:`, error)
            if (!imageUrls.value.heatMap[team]) {
              imageUrls.value.heatMap[team] = {}
            }
            imageUrls.value.heatMap[team][period] = null
          }
        }
      }
    }

    // Convertir shot maps
    for (const team of ['ColoColo', 'IndValle']) {
      for (const period of ['Full recording', '1st period', '2nd period']) {
        const gsUrl = mockData[team as keyof typeof mockData].shotMap[period as keyof typeof mockData.ColoColo.shotMap]?.screenshot
        console.log(`📍 Processing shot map: ${team} - ${period}`, gsUrl)
        if (gsUrl && storageService.isGsUrl(gsUrl)) {
          try {
            const httpsUrl = await storageService.convertGsUrlToHttps(gsUrl)
            if (!imageUrls.value.shotMap[team]) {
              imageUrls.value.shotMap[team] = {}
            }
            imageUrls.value.shotMap[team][period] = httpsUrl
            console.log(`✅ Converted shot map URL for ${team} ${period}:`, httpsUrl)
          } catch (error) {
            console.error(`❌ Failed to convert shot map URL for ${team} ${period}:`, error)
            if (!imageUrls.value.shotMap[team]) {
              imageUrls.value.shotMap[team] = {}
            }
            imageUrls.value.shotMap[team][period] = null
          }
        }
      }
    }
    console.log('✨ Image URL conversion complete!')
    console.log('Heat Map URLs:', imageUrls.value.heatMap)
    console.log('Shot Map URLs:', imageUrls.value.shotMap)
  } finally {
    loadingImages.value = false
  }
}

// Cargar URLs convertidas al montar
onMounted(() => {
  void convertImageUrls()
})

// Watch para cuando lleguen datos reales
watch(() => props.analyticsData, (newData) => {
  if (newData) {
    console.log('Analytics data received:', newData)
    // TODO: Procesar datos reales aquí
  }
}, { deep: true })
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

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

.debug-info {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
  color: #666;
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
  height: 250px;
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

  .section-title {
    font-size: 1.1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-value {
    font-size: 2rem;
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
