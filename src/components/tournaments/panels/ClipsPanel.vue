<template>
  <div class="clips-panel">
    <div v-if="loading" class="loading-container">
      <q-spinner-dots color="primary" size="50px" />
      <p class="text-grey-6">Cargando clips...</p>
    </div>

    <div v-else-if="!hasRealData" class="no-data-container">
      <q-card class="no-data-card">
        <q-card-section class="text-center q-pa-xl">
          <q-icon name="movie" size="120px" color="grey-4" class="q-mb-lg" />
          <h5 class="text-h5 text-weight-bold q-mb-md text-grey-7">
            No hay clips disponibles
          </h5>
          <p class="text-body1 text-grey-6 q-mb-md">
            Aún no se han procesado los clips para este partido.
          </p>
          <p class="text-body2 text-grey-5">
            Los clips estarán disponibles una vez que el partido haya sido procesado.
          </p>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="clips-content">
      <div class="video-section">
        <h5 class="section-title">
          <q-icon name="play_circle" size="24px" />
          Video Completo del Partido
        </h5>
        <q-card class="video-card" :class="{ 'video-highlight': isVideoHighlighted }">
          <q-card-section class="q-pa-none">
            <div class="video-wrapper">
              <iframe
                ref="youtubePlayer"
                :src="youtubeEmbedUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="youtube-iframe"
              ></iframe>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="clips-section">
        <h5 class="section-title">
          <q-icon name="movie" size="24px" />
          Momentos Destacados ({{ currentClips.length }})
        </h5>

        <div v-if="currentClips.length === 0" class="no-clips">
          <q-icon name="video_library" size="64px" color="grey-4" />
          <p class="text-grey-6">No hay clips disponibles</p>
        </div>

        <div v-else class="clips-grid">
          <q-card
            v-for="(clip, index) in currentClips"
            :key="index"
            class="clip-card"
          >
            <q-card-section class="clip-header">
              <q-chip
                :color="getTagColor(clip.tag)"
                text-color="white"
                size="sm"
                class="clip-tag"
              >
                {{ clip.tag }}
              </q-chip>
              <div class="clip-time">
                <span class="timecode">{{ clip.timecode }}</span>
              </div>
            </q-card-section>

            <q-card-section class="clip-actions">
              <q-btn
                outline
                color="primary"
                icon="play_arrow"
                label="Ver"
                size="sm"
                class="action-btn"
                @click="goToYouTubeTimestamp(clip.timeInSeconds)"
              />

              <q-btn
                v-if="clip.videoUrl"
                outline
                color="positive"
                icon="download"
                label="Descargar"
                size="sm"
                class="action-btn"
                @click="downloadClip(clip.videoUrl, clip.tag, clip.timecode)"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { openURL } from 'quasar'

// Props
interface Highlight {
  team: string
  side: 'home' | 'away'
  index: number
  tag: string
  timecode: string
  json: string // URL del video
  updatedAt?: Date
}

interface ProcessedHighlight {
  team: string
  side: 'home' | 'away'
  index: number
  tag: string
  timecode: string
  timeInSeconds: number
  videoUrl: string | null
}

interface Props {
  highlightsData?: Highlight[] // Array de highlights desde Firestore
  youtubeVideoId: string // El ID del video de YouTube (ej: "DtD7GNuF3xQ")
  varTime?: number // Segundos a restar de cada timecode para sincronizar con el video
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  youtubeVideoId: 'DtD7GNuF3xQ', // Video por defecto
  varTime: 0 // Por defecto no se resta nada
})

// State
const youtubePlayer = ref<HTMLIFrameElement | null>(null)
const isVideoHighlighted = ref(false)

// Helper function: Convertir timecode MM:SS a segundos
function timecodeToSeconds(timecode: string): number {
  const parts = timecode.split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0] || '0')
    const seconds = parseInt(parts[1] || '0')
    return minutes * 60 + seconds
  }
  return 0
}

// Computed: Verificar si hay datos reales
const hasRealData = computed(() => {
  return props.highlightsData && Array.isArray(props.highlightsData) && props.highlightsData.length > 0
})

// Computed: Todos los clips combinados de ambos equipos y procesados
const currentClips = computed<ProcessedHighlight[]>(() => {
  if (!hasRealData.value || !props.highlightsData) return []

  // Procesar TODOS los highlights (de ambos equipos)
  return props.highlightsData
    .map((highlight) => {
      // Convertir timecode a segundos
      const rawSeconds = timecodeToSeconds(highlight.timecode)

      // Aplicar VAR_TIME: restar los segundos de ajuste
      const adjustedSeconds = Math.max(0, rawSeconds - (props.varTime || 0))

      console.log(`🎯 Highlight #${highlight.index} (${highlight.team}): ${highlight.timecode} (${rawSeconds}s) - ${props.varTime}s = ${adjustedSeconds}s`)

      return {
        team: highlight.team,
        side: highlight.side,
        index: highlight.index,
        tag: highlight.tag,
        timecode: highlight.timecode,
        timeInSeconds: adjustedSeconds,
        videoUrl: highlight.json || null // El campo json contiene la URL del video
      }
    })
    .sort((a, b) => a.timeInSeconds - b.timeInSeconds) // Ordenar por tiempo (cronológico)
})

// YouTube embed URL con autoplay habilitado
const youtubeEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${props.youtubeVideoId}?enablejsapi=1&rel=0&autoplay=0`
})

// Functions
function goToYouTubeTimestamp(timeInSeconds: number) {
  console.log(`🎬 Jumping to ${timeInSeconds}s in the video`)

  if (youtubePlayer.value && youtubePlayer.value.contentWindow) {
    // Highlight effect
    isVideoHighlighted.value = true
    setTimeout(() => {
      isVideoHighlighted.value = false
    }, 2000)

    // Scroll hacia el video primero
    scrollToVideo()

    // Luego saltar al timestamp (esperar a que termine el scroll)
    setTimeout(() => {
      if (youtubePlayer.value && youtubePlayer.value.contentWindow) {
        // Usar YouTube IFrame API para controlar el reproductor
        youtubePlayer.value.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [timeInSeconds, true] // true = allowSeekAhead
          }),
          '*'
        )

        // Reproducir el video automáticamente
        setTimeout(() => {
          if (youtubePlayer.value && youtubePlayer.value.contentWindow) {
            youtubePlayer.value.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'playVideo',
                args: []
              }),
              '*'
            )
          }
        }, 100)
      }
    }, 600) // Esperar que termine el scroll
  }
}

function scrollToVideo() {
  // Scroll suave hacia el reproductor de video
  const videoCard = document.querySelector('.video-card')
  if (videoCard) {
    videoCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function downloadClip(videoUrl: string, tag: string, timecode: string) {
  if (!videoUrl) return

  console.log(`⬇️ Downloading clip: ${tag} at ${timecode}`)
  console.log(`📥 Video URL: ${videoUrl}`)

  try {
    // Crear un elemento <a> temporal para forzar la descarga
    const link = document.createElement('a')
    link.href = videoUrl

    // Generar nombre de archivo limpio
    const cleanTag = tag.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const cleanTimecode = timecode.replace(':', '_')
    link.download = `clip_${cleanTag}_${cleanTimecode}.mp4`

    // Añadir atributo para forzar descarga
    link.target = '_blank'
    link.rel = 'noopener noreferrer'

    // Añadir al DOM, hacer click y remover
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log('✅ Descarga iniciada')
  } catch (error) {
    console.error('❌ Error al descargar clip:', error)
    // Fallback: abrir en nueva pestaña
    openURL(videoUrl)
  }
}

function getTagColor(tag: string): string {
  const tagColors: Record<string, string> = {
    'Gol': 'positive',
    'Tiro directo a portería': 'primary',
    'Tiro de esquina': 'info',
    'Falta': 'warning',
    'Tarjeta amarilla': 'warning',
    'Tarjeta roja': 'negative',
    'Penalti': 'deep-orange',
    'Fuera de juego': 'grey-7'
  }

  return tagColors[tag] || 'grey-6'
}
</script>

<style scoped lang="scss">
.clips-panel {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
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
.clips-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
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

// Video Section
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
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.youtube-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

// No Clips
.no-clips {
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

// Clips Grid
.clips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.clip-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  font-size: 0.85rem; // Reducir tamaño de fuente general

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
}

.clip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%);
  border-bottom: 1px solid #E0E0E0;
}

.clip-tag {
  font-weight: 600;
  font-size: 0.65rem;

  :deep(.q-chip__content) {
    padding: 2px 8px;
  }
}

.clip-time {
  display: flex;
  align-items: center;

  .timecode {
    font-family: 'Courier New', monospace;
    font-weight: 900 !important;
    color: var(--q-accent);
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }
}

.clip-actions {
  padding: 10px 12px;
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  font-weight: 500;
  font-size: 0.7rem;
  padding: 6px 8px;

  :deep(.q-icon) {
    font-size: 16px;
  }
}

// Responsive
@media (max-width: 768px) {
  .clips-panel {
    padding: 8px;
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

  .clips-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .clip-header {
    padding: 6px 10px;
  }

  .clip-tag {
    font-size: 0.6rem;

    :deep(.q-chip__content) {
      padding: 2px 6px;
    }
  }

  .clip-time {
    .timecode {
      font-size: 0.7rem;
    }
  }

  .clip-actions {
    flex-direction: column;
    gap: 8px;

    .action-btn {
      width: 100%;
    }
  }
}
</style>
