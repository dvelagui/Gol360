<template>
  <div class="clips-panel">
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
      <p class="text-grey-6">Cargando clips...</p>
    </div>

    <!-- Content -->
    <div v-else class="clips-content">
      <!-- YouTube Video Player -->
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

      <!-- Clips List -->
      <div class="clips-section">
        <h5 class="section-title">
          <q-icon name="movie" size="24px" />
          Momentos Destacados ({{ currentClips.length }})
        </h5>

        <div v-if="currentClips.length === 0" class="no-clips">
          <q-icon name="video_library" size="64px" color="grey-4" />
          <p class="text-grey-6">No hay clips disponibles para este equipo</p>
        </div>

        <div v-else class="clips-grid">
          <q-card
            v-for="(clip, index) in currentClips"
            :key="index"
            class="clip-card"
            @click="goToYouTubeTimestamp(clip.timeInSeconds)"
          >
            <q-card-section class="clip-header">
              <div class="clip-index">#{{ clip.index }}</div>
              <q-chip
                :color="getTagColor(clip.tag)"
                text-color="white"
                size="sm"
                class="clip-tag"
              >
                {{ clip.tag }}
              </q-chip>
            </q-card-section>

            <q-card-section class="clip-body">
              <div class="clip-time">
                <q-icon name="schedule" size="20px" />
                <span class="timecode">{{ clip.timecode }}</span>
              </div>

              <div class="clip-team">
                <q-icon name="shield" size="18px" color="primary" />
                <span>{{ clip.team }}</span>
              </div>
            </q-card-section>

            <q-card-section class="clip-footer">
              <q-btn
                outline
                color="primary"
                icon="play_arrow"
                label="Ver momento"
                size="sm"
                class="full-width"
                @click.stop="goToYouTubeTimestamp(clip.timeInSeconds)"
              />

              <q-btn
                v-if="clip.videoUrl"
                flat
                dense
                color="grey-7"
                icon="download"
                size="sm"
                class="download-btn q-mt-sm"
                @click.stop="downloadClip(clip.videoUrl, clip.tag, clip.timecode)"
              >
                <q-tooltip>Descargar clip</q-tooltip>
              </q-btn>
            </q-card-section>

            <q-card-section v-if="clip.videoUrl" class="clip-thumbnail">
              <video
                :src="clip.videoUrl"
                class="clip-video-preview"
                preload="metadata"
                muted
                @mouseenter="(e) => (e.target as HTMLVideoElement)?.play()"
                @mouseleave="(e) => { const video = e.target as HTMLVideoElement; if (video) { video.pause(); video.currentTime = 0; } }"
              ></video>
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
interface Props {
  highlightsData?: unknown // TODO: Usar tipo HighlightsEntry[] cuando llegue la data real
  youtubeVideoId: string // El ID del video de YouTube (ej: "DtD7GNuF3xQ")
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  youtubeVideoId: 'DtD7GNuF3xQ' // Video por defecto
})

// DATOS MOCK - Basados en exampleApiAnalytics.json
const mockHighlights = {
  ColoColo: [
    {
      team: 'ColoColo',
      index: 1,
      tag: 'Tiro directo a portería',
      timecode: '04:07',
      timeInSeconds: 247,
      videoUrl: 'https://download.veocdn.com/bd7121e4-4378-4227-a2a7-60036cf5fb22/highlight-v2/ce631023-2764-46e6-89f5-4c03096e396e_1756678475.097234/video.mp4?name=000342-shot-on-goal.mp4'
    },
    {
      team: 'ColoColo',
      index: 2,
      tag: 'Tiro directo a portería',
      timecode: '05:39',
      timeInSeconds: 339,
      videoUrl: 'https://download.veocdn.com/bd7121e4-4378-4227-a2a7-60036cf5fb22/highlight-v2/55e80fff-92fa-4226-972c-7a330b2cbd3a_1756678475.097234/video.mp4?name=000407-shot-on-goal.mp4'
    },
    {
      team: 'ColoColo',
      index: 3,
      tag: 'Gol',
      timecode: '10:44',
      timeInSeconds: 644,
      videoUrl: 'https://download.veocdn.com/bd7121e4-4378-4227-a2a7-60036cf5fb22/highlight-v2/fb92bbee-ea00-4056-8d07-2aaadbc0f1a4_1756678475.097234/video.mp4?name=000539-shot-on-goal.mp4'
    },
    {
      team: 'ColoColo',
      index: 4,
      tag: 'Tiro directo a portería',
      timecode: '12:15',
      timeInSeconds: 735,
      videoUrl: null
    },
    {
      team: 'ColoColo',
      index: 5,
      tag: 'Tiro de esquina',
      timecode: '15:23',
      timeInSeconds: 923,
      videoUrl: null
    }
  ],
  IndValle: [
    {
      team: 'IndValle',
      index: 1,
      tag: 'Gol',
      timecode: '08:12',
      timeInSeconds: 492,
      videoUrl: null
    },
    {
      team: 'IndValle',
      index: 2,
      tag: 'Tiro directo a portería',
      timecode: '14:30',
      timeInSeconds: 870,
      videoUrl: null
    },
    {
      team: 'IndValle',
      index: 3,
      tag: 'Gol',
      timecode: '22:45',
      timeInSeconds: 1365,
      videoUrl: null
    }
  ]
}

// State
const selectedTeam = ref<'ColoColo' | 'IndValle'>('ColoColo')
const youtubePlayer = ref<HTMLIFrameElement | null>(null)
const isVideoHighlighted = ref(false)

// Team options for toggle
const teamOptions = [
  { label: 'Colo Colo', value: 'ColoColo' },
  { label: 'Ind. Valle', value: 'IndValle' }
]

// Computed
const currentClips = computed(() => mockHighlights[selectedTeam.value] || [])

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

  // Abrir URL de descarga en nueva pestaña
  openURL(videoUrl)
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.clip-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .clip-video-preview {
      transform: scale(1.05);
    }
  }
}

.clip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%);
}

.clip-index {
  font-size: 1.2rem;
  font-weight: 700;
  color: #064F34;
}

.clip-tag {
  font-weight: 600;
  font-size: 0.75rem;
}

.clip-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clip-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;

  .timecode {
    font-family: 'Courier New', monospace;
    background: #F5F7FA;
    padding: 4px 12px;
    border-radius: 6px;
  }
}

.clip-team {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #666;
}

.clip-footer {
  padding: 12px 16px;
  background: #F5F7FA;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.download-btn {
  width: 100%;
}

.clip-thumbnail {
  padding: 0;
  height: 180px;
  overflow: hidden;
  position: relative;
  background: #000;
}

.clip-video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

// Responsive
@media (max-width: 768px) {
  .clips-panel {
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

  .clips-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .clip-thumbnail {
    height: 160px;
  }
}
</style>
