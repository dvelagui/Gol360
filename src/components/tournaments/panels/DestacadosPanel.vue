<template>
  <div class="destacados-panel">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots color="primary" size="50px" />
      <p class="text-grey-6">Cargando momentos...</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasRealData" class="no-data-container">
      <q-card class="no-data-card">
        <q-card-section class="text-center q-pa-xl">
          <q-icon name="sports_soccer" size="80px" color="grey-4" />
          <div class="text-h5 q-mt-md text-grey-7">No hay datos disponibles</div>
          <p class="text-grey-6 q-mt-sm">
            Aún no se han cargado los momentos destacados para este partido.
          </p>
        </q-card-section>
      </q-card>
    </div>

    <!-- Content with Real Data -->
    <template v-else>
      <div class="player-selector-wrapper">
        <q-card class="player-selector-card">
          <q-card-section class="q-pa-md">
            <div class="selector-content">
              <div class="selector-label">
                <q-icon name="person" size="24px" />
                <span class="text-h6">Selecciona un jugador</span>
              </div>
              <q-select
                v-model="selectedPlayer"
                :options="playerOptions"
                option-value="name"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
                class="player-select"
                :disable="loading || playerOptions.length === 0"
              >
                <template #prepend>
                  <q-icon name="sports_soccer" />
                </template>
                <template v-if="playerOptions.length === 0" #no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">
                      No hay jugadores disponibles
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="selectedPlayer" class="destacados-content">
        <div class="video-section">
          <div class="video-header">
            <h5 class="section-title">
              <q-icon name="play_circle" size="24px" />
              Video - {{ selectedPlayerData?.label }}
            </h5>

            <div class="autoplay-controls">
              <q-btn
                v-if="!isAutoPlaying"
                outline
                color="primary"
                icon="play_arrow"
                label="Reproducción automática"
                @click="startAutoPlay"
              />
              <q-btn
                v-else
                outline
                color="negative"
                icon="stop"
                label="Detener"
                @click="stopAutoPlay"
              />

              <q-chip
                v-if="isAutoPlaying"
                color="primary"
                text-color="white"
                icon="play_circle"
                class="q-ml-sm"
              >
                Momento {{ currentMomentIndex + 1 }}/{{ currentMoments.length }}
              </q-chip>

              <!-- Toggle para tracking - OCULTO TEMPORALMENTE -->
              <!--
              <q-separator vertical inset class="q-mx-sm" />

              <q-btn
                v-if="!trackingData"
                outline
                color="secondary"
                icon="download"
                label="Cargar Tracking"
                :loading="isLoadingTracking"
                @click="loadTrackingData"
              />

              <q-toggle
                v-else
                v-model="showTracking"
                color="secondary"
                icon="visibility"
                label="Tracking"
              />
              -->
            </div>
          </div>

          <q-card class="video-card" :class="{ 'video-highlight': isVideoHighlighted }">
            <q-card-section class="q-pa-none">
              <div class="video-wrapper" ref="videoWrapper">
                <!-- YouTube Player div - El API creará el iframe aquí -->
                <div
                  ref="youtubePlayerDiv"
                  class="youtube-player"
                ></div>

                <!-- Canvas overlay para player tracking -->
                <canvas
                  v-if="showTracking && trackingData"
                  ref="trackingCanvas"
                  class="tracking-canvas"
                  :width="canvasWidth"
                  :height="canvasHeight"
                ></canvas>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="moments-section">
          <h5 class="section-title">
            <q-icon name="video_library" size="24px" />
            Momentos Destacados ({{ currentMoments.length }})
          </h5>

          <div v-if="currentMoments.length === 0" class="no-moments">
            <q-icon name="video_library" size="64px" color="grey-4" />
            <p class="text-grey-6">No hay momentos disponibles para este jugador</p>
          </div>

          <div v-else class="moments-list">
            <q-card
              v-for="(moment, index) in currentMoments"
              :key="index"
              class="moment-card"
              :class="{ 'moment-active': currentMomentIndex === index }"
              @click="goToMoment(index)"
            >
              <q-card-section class="moment-content">
                <div class="moment-index">
                  <q-icon
                    :name="currentMomentIndex === index ? 'play_circle' : 'radio_button_unchecked'"
                    :color="currentMomentIndex === index ? 'primary' : 'grey-6'"
                    size="32px"
                  />
                  <span class="index-number">#{{ index + 1 }}</span>
                </div>

                <div class="moment-details">
                  <div class="moment-time">
                    <q-icon name="schedule" size="20px" />
                    <span class="timecode">{{ moment.startTime }}</span>
                  </div>

                  <div class="moment-duration">
                    <q-icon name="timer" size="18px" color="grey-7" />
                    <span>{{ moment.duration }}</span>
                  </div>
                </div>

                <q-btn
                  outline
                  :color="currentMomentIndex === index ? 'primary' : 'grey-7'"
                  icon="play_arrow"
                  label="Ver"
                  size="sm"
                  class="moment-play-btn"
                  @click.stop="goToMoment(index)"
                />
              </q-card-section>

              <q-linear-progress
                v-if="currentMomentIndex === index && isAutoPlaying"
                :value="progressPercent"
                color="primary"
                class="moment-progress"
              />
            </q-card>
          </div>
        </div>
      </div>

      <div v-else class="no-player-selected">
        <q-icon name="person_search" size="64px" color="grey-4" />
        <p class="text-grey-6">Selecciona un jugador para ver sus momentos destacados</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import playerTrackingService, {
  type PlayerTrackingData
  // type TrackingMetadata // TODO: Importar cuando implemente loadTrackingData completo
} from '@/services/playerTrackingService'

// ============================================
// INTERFACES - Real Firestore Data Structure
// ============================================

/**
 * Momento individual de un jugador
 * Matches Firestore structure from playerMoments subcollection
 */
interface PlayerMoment {
  startTime: string      // "00:54" - Tiempo en formato MM:SS
  duration: string       // "14s" - Duración del momento
  trackingStart: number  // Frame inicial en el tracking (ej: 54)
  trackingEnd: number    // Frame final en el tracking (ej: 68)
}

/**
 * Data completa de momentos de un jugador
 * Document structure: tournaments/{tournamentId}/matches/{matchId}/playerMoments/{side}_{namePlayer}
 */
interface PlayerMomentsData {
  side: 'home' | 'away'
  team: string
  namePlayer: string
  momentsCount: number
  moments: PlayerMoment[]
}

// Props
interface Props {
  playerMomentsData?: PlayerMomentsData[]
  youtubeVideoId: string
  matchStart?: string  // "MM:SS" - Tiempo cuando empieza el partido en el video
  tournamentId: string
  matchId: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  youtubeVideoId: 'DtD7GNuF3xQ',
  matchStart: '00:00'
})

// ============================================
// STATE
// ============================================
const selectedPlayer = ref<string>('')
const youtubePlayerDiv = ref<HTMLDivElement | null>(null)
const videoWrapper = ref<HTMLDivElement | null>(null)
const trackingCanvas = ref<HTMLCanvasElement | null>(null)
const isVideoHighlighted = ref(false)
const isAutoPlaying = ref(false)
const currentMomentIndex = ref(0)
const progressPercent = ref(0)

// Player Tracking State
const trackingData = ref<PlayerTrackingData | null>(null)
const isLoadingTracking = ref(false)
const showTracking = ref(false)
const canvasWidth = ref(1280)
const canvasHeight = ref(720)
const currentVideoTime = ref(0)

// YouTube IFrame API Types
interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

interface YTPlayerEvent {
  data: number
}

// YouTube IFrame API
let ytPlayer: YTPlayer | null = null
let autoPlayInterval: number | null = null
let countdownInterval: number | null = null
let videoTimeInterval: number | null = null

// ============================================
// COMPUTED - Real Data Integration
// ============================================

/**
 * Verificar si hay datos reales de Firestore
 */
const hasRealData = computed(() => {
  return !!(props.playerMomentsData && props.playerMomentsData.length > 0)
})

/**
 * Todos los jugadores disponibles
 * Ya vienen filtrados por el componente padre según el rol del usuario
 */
const allPlayers = computed(() => {
  if (!hasRealData.value) return []
  return props.playerMomentsData || []
})

/**
 * Opciones para el selector de jugadores
 * Formato: "side_namePlayer" como value, "namePlayer (team)" como label
 */
const playerOptions = computed(() => {
  return allPlayers.value.map(player => ({
    name: `${player.side}_${player.namePlayer}`,
    label: `${player.namePlayer} (${player.team})`,
    team: player.team,
    side: player.side,
    playerName: player.namePlayer
  }))
})

/**
 * Data del jugador seleccionado
 */
const selectedPlayerData = computed(() => {
  if (!selectedPlayer.value) return null
  return playerOptions.value.find(p => p.name === selectedPlayer.value)
})

/**
 * Momentos del jugador seleccionado
 */
const currentMoments = computed(() => {
  if (!selectedPlayer.value || !hasRealData.value) return []
  const player = allPlayers.value.find(
    p => `${p.side}_${p.namePlayer}` === selectedPlayer.value
  )
  return player?.moments || []
})

// NOTA: youtubeEmbedUrl ya no se necesita porque usamos YouTube IFrame API directamente

// ============================================
// WATCHERS
// ============================================

/**
 * Watch player change - reset state
 */
watch(selectedPlayer, () => {
  console.log('[DestacadosPanel] Player changed to:', selectedPlayer.value)
  stopAutoPlay()
  currentMomentIndex.value = 0
  progressPercent.value = 0
})

/**
 * Watch data change - auto-select first player on load
 */
watch(
  () => props.playerMomentsData,
  (newData) => {
    if (newData && newData.length > 0 && !selectedPlayer.value) {
      console.log('[DestacadosPanel] Data loaded, auto-selecting first player')
      const firstPlayer = playerOptions.value[0]
      if (firstPlayer) {
        selectedPlayer.value = firstPlayer.name
        console.log('[DestacadosPanel] Selected:', selectedPlayer.value)
      }
    }
  },
  { immediate: true }
)

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convierte MATCH_START de formato "MM:SS" a segundos
 * @example parseMatchStart("08:25") → 505 segundos
 */
function parseMatchStart(matchStart: string): number {
  if (!matchStart) return 0

  const parts = matchStart.split(':')
  if (parts.length !== 2) return 0

  const minutes = parseInt(parts[0] || '0')
  const seconds = parseInt(parts[1] || '0')

  return minutes * 60 + seconds
}

// NOTA:
// - startTime: Tiempo del PARTIDO (desde inicio del partido). Para obtener tiempo del VIDEO, sumar MATCH_START
// - trackingStart/trackingEnd: Frames de tracking (1 frame = 1 segundo). También representan segundos desde inicio del partido
// - Fórmula para video: videoTime = startTime + MATCH_START
// - Fórmula para canvas: currentFrame = videoTime - MATCH_START

// ============================================
// MAIN FUNCTIONS
// ============================================

function goToMoment(index: number) {
  console.log(`🎬 Going to moment ${index + 1}`)

  currentMomentIndex.value = index
  const moment = currentMoments.value[index]

  if (!moment) {
    console.warn('[goToMoment] Moment not found at index:', index)
    return
  }

  // IMPORTANTE: startTime es el tiempo del PARTIDO, necesitamos sumar MATCH_START para obtener tiempo del VIDEO
  // Fórmula: videoTime = startTime (partido) + matchStart (offset del video)
  const momentTimeInSeconds = parseMatchStart(moment.startTime)
  const matchStartSeconds = parseMatchStart(props.matchStart || '00:00')
  const videoTimeInSeconds = momentTimeInSeconds + matchStartSeconds

  console.log(`[goToMoment] Moment #${index + 1}:
    startTime (partido): ${moment.startTime} → ${momentTimeInSeconds}s
    matchStart (offset): ${props.matchStart} → ${matchStartSeconds}s
    videoTime (YouTube): ${videoTimeInSeconds}s
    duration: ${moment.duration}`)

  // Visual highlight
  isVideoHighlighted.value = true
  setTimeout(() => {
    isVideoHighlighted.value = false
  }, 2000)

  // Scroll to video
  scrollToVideo()

  // Jump to timestamp and play
  setTimeout(() => {
    seekAndPlay(videoTimeInSeconds)
  }, 600)
}

function seekAndPlay(timeInSeconds: number) {
  if (!ytPlayer) {
    console.warn('[seekAndPlay] YouTube player not initialized')
    return
  }

  try {
    // Seek to timestamp
    ytPlayer.seekTo(timeInSeconds, true)

    // Play
    setTimeout(() => {
      if (ytPlayer) {
        ytPlayer.playVideo()
      }
    }, 100)
  } catch (error) {
    console.error('[seekAndPlay] Error:', error)
  }
}

function scrollToVideo() {
  const videoCard = document.querySelector('.video-card')
  if (videoCard) {
    videoCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

/**
 * Inicia la reproducción automática de todos los momentos en secuencia
 * Sin countdown - reproducción continua
 */
function startAutoPlay() {
  if (currentMoments.value.length === 0) {
    console.warn('[startAutoPlay] No hay momentos para reproducir')
    return
  }

  console.log('▶️ Starting auto-play for', currentMoments.value.length, 'moments')
  isAutoPlaying.value = true

  // Empezar desde el primer momento
  currentMomentIndex.value = 0
  playCurrentMoment()
}

/**
 * Detiene la reproducción automática
 */
function stopAutoPlay() {
  console.log('⏸️ Stopping auto-play')
  isAutoPlaying.value = false
  clearIntervals()
  progressPercent.value = 0
}

/**
 * Reproduce el momento actual y programa el siguiente
 */
function playCurrentMoment() {
  if (!isAutoPlaying.value) return

  const index = currentMomentIndex.value
  const moment = currentMoments.value[index]

  if (!moment) {
    console.warn('[playCurrentMoment] Moment not found at index:', index)
    stopAutoPlay()
    return
  }

  console.log(`[playCurrentMoment] Playing moment ${index + 1}/${currentMoments.value.length}`)

  // IMPORTANTE: startTime es el tiempo del PARTIDO, sumar MATCH_START para obtener tiempo del VIDEO
  const momentTimeInSeconds = parseMatchStart(moment.startTime)
  const matchStartSeconds = parseMatchStart(props.matchStart || '00:00')
  const videoTimeInSeconds = momentTimeInSeconds + matchStartSeconds

  // Calcular duración del momento en segundos desde el tracking
  const durationInSeconds = moment.trackingEnd - moment.trackingStart

  console.log(`[playCurrentMoment]
    Match time: ${moment.startTime} → ${momentTimeInSeconds}s
    Match start offset: ${props.matchStart} → ${matchStartSeconds}s
    Video time: ${videoTimeInSeconds}s
    Duration: ${durationInSeconds}s`)

  // Visual highlight
  isVideoHighlighted.value = true
  setTimeout(() => {
    isVideoHighlighted.value = false
  }, 1500)

  // Saltar al momento y reproducir
  seekAndPlay(videoTimeInSeconds)

  // Programar siguiente momento después de que termine este
  // Agregamos 1 segundo de buffer entre momentos
  const timeUntilNext = (durationInSeconds + 1) * 1000

  clearIntervals()
  autoPlayInterval = window.setTimeout(() => {
    goToNextMoment()
  }, timeUntilNext)

  // Actualizar progress bar
  progressPercent.value = 0
  const progressInterval = 50 // Update every 50ms
  const progressIncrement = progressInterval / (durationInSeconds * 1000)

  countdownInterval = window.setInterval(() => {
    if (!isAutoPlaying.value) {
      clearIntervals()
      return
    }

    progressPercent.value += progressIncrement
    if (progressPercent.value >= 1) {
      progressPercent.value = 1
      clearInterval(countdownInterval!)
    }
  }, progressInterval)
}

/**
 * Avanza al siguiente momento en la secuencia
 */
function goToNextMoment() {
  if (!isAutoPlaying.value) return

  const nextIndex = currentMomentIndex.value + 1

  if (nextIndex < currentMoments.value.length) {
    // Hay más momentos, continuar
    currentMomentIndex.value = nextIndex
    playCurrentMoment()
  } else {
    // Terminamos todos los momentos
    console.log('✅ Auto-play completado. Todos los momentos reproducidos.')
    stopAutoPlay()
  }
}

function clearIntervals() {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  if (autoPlayInterval !== null) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
  if (videoTimeInterval !== null) {
    clearInterval(videoTimeInterval)
    videoTimeInterval = null
  }
}

// ============================================
// PLAYER TRACKING FUNCTIONS
// ============================================

/**
 * Carga la metadata y descarga los datos de tracking
 * Usa Firebase Storage SDK para evitar problemas de CORS
 * NOTA: Temporalmente no se usa (botón comentado en template)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadTrackingData() {
  console.log('[loadTrackingData] Starting tracking data download...', {
    tournamentId: props.tournamentId,
    matchId: props.matchId
  })

  isLoadingTracking.value = true

  try {
    // Usar Cloud Function proxy para evitar problemas de CORS
    console.log('[loadTrackingData] Using Cloud Function proxy...')

    const data = await playerTrackingService.downloadTrackingDataViaProxy(
      props.tournamentId,
      props.matchId
    )

    if (!data) {
      console.error('[loadTrackingData] Failed to download tracking data')
      return
    }

    // Guardar datos en el state
    trackingData.value = data

    // Activar visualización automáticamente
    showTracking.value = true

    console.log('✅ [loadTrackingData] Tracking data loaded successfully!')
    console.log(`[loadTrackingData] Total frames: ${Object.keys(data).length}`)

    // Log primeros y últimos frames para debug
    const frameKeysRaw = Object.keys(data).slice(0, 10)
    console.log(`[loadTrackingData] First 10 keys (raw):`, frameKeysRaw)

    const frameKeys = Object.keys(data).map(k => parseInt(k)).sort((a, b) => a - b)
    console.log(`[loadTrackingData] First frames: ${frameKeys.slice(0, 10).join(', ')}`)
    console.log(`[loadTrackingData] Last frames: ${frameKeys.slice(-5).join(', ')}`)

    // Test: buscar frame 2603 directamente
    const testFrame = '2603'
    console.log(`[loadTrackingData] Test - Frame ${testFrame} exists:`, testFrame in data)
    if (testFrame in data) {
      console.log(`[loadTrackingData] Test - Frame ${testFrame} has ${Object.keys(data[testFrame]).length} players`)
    }
  } catch (error) {
    console.error('[loadTrackingData] Error:', error)
    console.error('[loadTrackingData] Verifica que:')
    console.error('  1. Firebase Functions esté corriendo (firebase emulators:start)')
    console.error('  2. El archivo existe en: raw/{tournamentId}/{matchId}/player-tracking.json')
    console.error('  3. Las reglas de Storage permiten lectura')
    // TODO: Mostrar notificación de error al usuario
  } finally {
    isLoadingTracking.value = false
  }
}

/**
 * Ajusta el tamaño del canvas al tamaño del video wrapper
 */
function resizeCanvas() {
  if (!videoWrapper.value || !trackingCanvas.value) return

  const rect = videoWrapper.value.getBoundingClientRect()
  canvasWidth.value = rect.width
  canvasHeight.value = rect.height

  console.log('[resizeCanvas] Canvas resized:', {
    width: canvasWidth.value,
    height: canvasHeight.value
  })
}

/**
 * Dibuja el tracking de jugadores en el canvas
 */
function drawTracking() {
  if (!trackingCanvas.value) {
    console.log('[drawTracking] No canvas element')
    return
  }

  if (!trackingData.value) {
    console.log('[drawTracking] No tracking data')
    return
  }

  if (!showTracking.value) {
    console.log('[drawTracking] Tracking is disabled')
    return
  }

  const canvas = trackingCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.log('[drawTracking] No canvas context')
    return
  }

  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // DEBUG: Dibujar rectángulo rojo para verificar que canvas es visible
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
  ctx.fillRect(0, 0, 200, 100)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 20px Arial'
  ctx.fillText('CANVAS TEST', 10, 50)

  // Calcular frame actual basado en tiempo del video
  const matchStartSeconds = parseMatchStart(props.matchStart || '00:00')
  const currentFrame = Math.floor(currentVideoTime.value - matchStartSeconds)

  console.log(`[drawTracking] Video time: ${currentVideoTime.value}s, Frame: ${currentFrame}, matchStart: ${matchStartSeconds}s`)

  // Obtener datos del frame
  const frameData = playerTrackingService.getFrameData(trackingData.value, currentFrame)

  if (!frameData) {
    console.log(`[drawTracking] No frame data for frame ${currentFrame}`)
    return
  }

  console.log(`[drawTracking] Frame ${currentFrame}: ${Object.keys(frameData).length} players`)
  console.log(`[drawTracking] Canvas size: ${canvas.width}x${canvas.height}`)

  // DEBUG: Ver estructura completa del frame
  const firstKey = Object.keys(frameData)[0]
  if (firstKey) {
    console.log(`[drawTracking] Frame data structure:`, JSON.stringify(frameData[firstKey]))
  }

  // La estructura real es: frameData[index] = [nombreJugador, jersey, x, y, ?]
  // x, y están en metros (aproximadamente -50 a 50 para x, -35 a 35 para y)
  // Necesitamos convertir a coordenadas del canvas

  // Campo de fútbol típico: 105m x 68m
  const FIELD_WIDTH = 105  // metros
  const FIELD_HEIGHT = 68  // metros

  // Dibujar cada jugador
  let drawnCount = 0
  Object.values(frameData).forEach((playerData: unknown) => {
    if (!Array.isArray(playerData) || playerData.length < 4) return

    const [playerName, jersey, xMeters, yMeters] = playerData as [string, string | number, number, number]

    // Convertir coordenadas de metros a píxeles del canvas
    // Asumimos que (0,0) está en el centro del campo
    // xMeters: -52.5 a 52.5, yMeters: -34 a 34
    const xNormalized = (xMeters + FIELD_WIDTH / 2) / FIELD_WIDTH  // 0 a 1
    const yNormalized = (yMeters + FIELD_HEIGHT / 2) / FIELD_HEIGHT  // 0 a 1

    const x = xNormalized * canvas.width
    const y = yNormalized * canvas.height

    if (drawnCount === 0) {
      console.log(`[drawTracking] First player: ${playerName}, meters: (${xMeters}, ${yMeters}) → normalized: (${xNormalized.toFixed(2)}, ${yNormalized.toFixed(2)}) → pixels: (${x.toFixed(0)}, ${y.toFixed(0)})`)
    }
    drawnCount++

    // Determinar equipo por nombre
    const isHome = playerName.includes('Arsenal')  // Ajustar según tus datos
    const team = isHome ? 'home' : 'away'

    // Determinar si este jugador está seleccionado
    const isSelected = isPlayerSelectedByName(playerName)

    // Dibujar punto del jugador
    ctx.beginPath()
    ctx.arc(x, y, isSelected ? 12 : 8, 0, 2 * Math.PI)

    // Color según equipo
    if (team === 'home') {
      ctx.fillStyle = isSelected ? '#FFFF00' : '#FF0000'
    } else {
      ctx.fillStyle = isSelected ? '#00FFFF' : '#0000FF'
    }

    ctx.fill()

    // Borde blanco para mejor visibilidad
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    // Mostrar número de camiseta o nombre si existe
    if (jersey) {
      ctx.fillStyle = '#FFFFFF'
      ctx.font = isSelected ? 'bold 14px Arial' : 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(jersey.toString(), x, y)
    }

    // Si está seleccionado, dibujar círculo adicional
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(x, y, 20, 0, 2 * Math.PI)
      ctx.strokeStyle = '#FFFF00'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  })
}

/**
 * Determina si un jugador del tracking está seleccionado por nombre
 */
function isPlayerSelectedByName(playerName: string): boolean {
  if (!selectedPlayer.value) return false

  const selectedData = selectedPlayerData.value
  if (!selectedData) return false

  // El nombre del tracking es como "Arsenal_Portero" o "Arsenal_11"
  // El nombre seleccionado es como "Portero" o "Camisetan.º11"

  const trackingPlayerName = selectedData.playerName

  // Comparar nombres (case insensitive)
  if (playerName.toLowerCase().includes(trackingPlayerName.toLowerCase())) {
    return true
  }

  // Si el jugador seleccionado tiene un número, buscar ese número en el tracking
  const numberMatch = trackingPlayerName.match(/\d+/)
  if (numberMatch) {
    const number = numberMatch[0]
    // El tracking puede tener "Arsenal_11" o solo "11"
    if (playerName.includes(`_${number}`) || playerName.endsWith(number)) {
      return true
    }
  }

  return false
}

/**
 * Actualiza el tiempo actual del video desde YouTube Player
 */
function updateVideoTime() {
  if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') {
    return
  }

  try {
    const currentTime = ytPlayer.getCurrentTime()
    if (currentTime !== undefined && !isNaN(currentTime)) {
      currentVideoTime.value = currentTime
    }
  } catch (error) {
    console.error('[updateVideoTime] Error getting current time:', error)
  }
}

/**
 * Inicializa el YouTube IFrame API Player
 */
function initYouTubePlayer() {
  if (!youtubePlayerDiv.value) {
    console.error('[initYouTubePlayer] Player div not found')
    return
  }

  console.log('[initYouTubePlayer] Initializing YouTube Player...')

  interface WindowWithYT extends Window {
    YT?: {
      Player: new (elementId: HTMLElement, config: Record<string, unknown>) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }

  const windowWithYT = window as WindowWithYT

  // Cargar el script de YouTube IFrame API si no está cargado
  if (!windowWithYT.YT) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    if (firstScriptTag?.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    // Esperar a que el API esté lista
    windowWithYT.onYouTubeIframeAPIReady = () => {
      createPlayer()
    }
  } else {
    // El API ya está cargada
    createPlayer()
  }
}

/**
 * Crea el YouTube Player
 */
function createPlayer() {
  if (!youtubePlayerDiv.value) return

  interface WindowWithYT extends Window {
    YT?: {
      Player: new (elementId: HTMLElement, config: Record<string, unknown>) => YTPlayer
    }
  }

  const windowWithYT = window as WindowWithYT

  if (!windowWithYT.YT) {
    console.error('[createPlayer] YouTube API not loaded')
    return
  }

  console.log('[createPlayer] Creating YouTube Player with videoId:', props.youtubeVideoId)

  ytPlayer = new windowWithYT.YT.Player(youtubePlayerDiv.value, {
    height: '100%',
    width: '100%',
    videoId: props.youtubeVideoId,
    playerVars: {
      enablejsapi: 1,
      rel: 0,
      autoplay: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  })
}

/**
 * Evento: Player está listo
 */
function onPlayerReady() {
  console.log('[onPlayerReady] YouTube Player is ready')
}

/**
 * Evento: Estado del player cambió
 */
function onPlayerStateChange(event: YTPlayerEvent) {
  const states: Record<number, string> = {
    '-1': 'unstarted',
    '0': 'ended',
    '1': 'playing',
    '2': 'paused',
    '3': 'buffering',
    '5': 'video cued'
  }

  console.log('[onPlayerStateChange] State:', states[event.data] || event.data)

  // Si el video está reproduciendo, actualizar canvas más frecuentemente
  if (event.data === 1) {
    // Playing
    startVideoTimeTracking()
  } else {
    // Paused, ended, etc.
    stopVideoTimeTracking()
  }
}

/**
 * Inicia el tracking del tiempo del video
 */
function startVideoTimeTracking() {
  if (videoTimeInterval) return // Ya está corriendo

  videoTimeInterval = window.setInterval(() => {
    updateVideoTime()
    if (showTracking.value && trackingData.value) {
      drawTracking()
    }
  }, 100) // Actualizar cada 100ms para mejor sincronización
}

/**
 * Detiene el tracking del tiempo del video
 */
function stopVideoTimeTracking() {
  if (videoTimeInterval) {
    clearInterval(videoTimeInterval)
    videoTimeInterval = null
  }
}

// Lifecycle hooks
onMounted(() => {
  // Ajustar tamaño del canvas
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Inicializar YouTube Player
  initYouTubePlayer()
})

// Cleanup on unmount
onBeforeUnmount(() => {
  clearIntervals()
  stopVideoTimeTracking()
  window.removeEventListener('resize', resizeCanvas)

  // Destruir YouTube Player
  if (ytPlayer && typeof ytPlayer.destroy === 'function') {
    ytPlayer.destroy()
    ytPlayer = null
  }
})
</script>

<style scoped lang="scss">
.destacados-panel {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

// Player Selector
.player-selector-wrapper {
  margin-bottom: 24px;
}

.player-selector-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.selector-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #064F34;
  font-weight: 600;
}

.player-select {
  max-width: 500px;
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
  padding: 32px 16px;
}

.no-data-card {
  max-width: 600px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

// Content
.destacados-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

// Video Section
.video-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #064F34;
  margin: 0;
  padding-left: 4px;
}

.autoplay-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  &.video-highlight {
    box-shadow: 0 0 0 4px #064F34, 0 8px 32px rgba(6, 79, 52, 0.3);
    transform: scale(1.02);
    animation: pulse 0.6s ease-in-out;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px #064F34, 0 8px 32px rgba(6, 79, 52, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px #138A59, 0 12px 40px rgba(19, 138, 89, 0.4);
  }
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9; /* Modern way to maintain 16:9 ratio */
  overflow: hidden;
}

.youtube-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Video en capa inferior */

  // El iframe creado por YouTube API
  :deep(iframe) {
    width: 100%;
    height: 100%;
  }
}

.tracking-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Permitir clics en el video debajo */
  z-index: 2; /* Canvas sobre el video */
}

// No Player Selected
.no-player-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  gap: 16px;
}

// No Moments
.no-moments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  gap: 16px;
}

// Moments List
.moments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.moment-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  &.moment-active {
    border: 2px solid #064F34;
    box-shadow: 0 4px 16px rgba(6, 79, 52, 0.2);
  }
}

.moment-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.moment-index {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;

  .index-number {
    font-size: 0.85rem;
    font-weight: 600;
    color: #666;
  }
}

.moment-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.moment-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;

  .timecode {
    font-family: 'Courier New', monospace;
    background: #F5F7FA;
    padding: 4px 12px;
    border-radius: 6px;
  }
}

.moment-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
}

.moment-play-btn {
  min-width: 80px;
}

.moment-progress {
  height: 4px;
}

// Responsive
@media (max-width: 768px) {
  .destacados-panel {
    padding: 8px;
  }

  .video-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .moment-content {
    flex-wrap: wrap;
    gap: 12px;
  }

  .moment-play-btn {
    width: 100%;
  }
}
</style>
