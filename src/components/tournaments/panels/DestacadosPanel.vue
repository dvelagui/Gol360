<template>
  <div class="destacados-panel">
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
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="shield" />
              </template>
            </q-select>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="loading" class="loading-container">
      <q-spinner-dots color="primary" size="50px" />
      <p class="text-grey-6">Cargando momentos...</p>
    </div>

    <div v-else-if="selectedPlayer" class="destacados-content">
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
              icon="pause"
              label="Detener automático"
              @click="stopAutoPlay"
            />

            <q-chip
              v-if="isAutoPlaying"
              color="primary"
              text-color="white"
              icon="timer"
              class="q-ml-sm"
            >
              {{ countdown }}s
            </q-chip>
          </div>
        </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

// Props
interface Props {
  playerMomentsData?: unknown // TODO: Usar tipo PlayerMomentsEntry[] cuando llegue la data real
  youtubeVideoId: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  youtubeVideoId: 'DtD7GNuF3xQ'
})

// DATOS MOCK - Basados en exampleApiAnalytics.json
const mockPlayerMoments = {
  ColoColo: [
    {
      team: 'ColoColo',
      name: 'Goalkeeper',
      moments: [
        {
          startTime: '02:28',
          duration: '11s',
          startTimeInSeconds: 148,
          durationInSeconds: 11,
          endTimeInSeconds: 159
        },
        {
          startTime: '03:53',
          duration: '12s',
          startTimeInSeconds: 233,
          durationInSeconds: 12,
          endTimeInSeconds: 245
        },
        {
          startTime: '05:11',
          duration: '10s',
          startTimeInSeconds: 311,
          durationInSeconds: 10,
          endTimeInSeconds: 321
        },
        {
          startTime: '07:45',
          duration: '15s',
          startTimeInSeconds: 465,
          durationInSeconds: 15,
          endTimeInSeconds: 480
        }
      ]
    },
    {
      team: 'ColoColo',
      name: 'Player 1',
      moments: [
        {
          startTime: '01:15',
          duration: '8s',
          startTimeInSeconds: 75,
          durationInSeconds: 8,
          endTimeInSeconds: 83
        },
        {
          startTime: '12:30',
          duration: '12s',
          startTimeInSeconds: 750,
          durationInSeconds: 12,
          endTimeInSeconds: 762
        },
        {
          startTime: '18:45',
          duration: '10s',
          startTimeInSeconds: 1125,
          durationInSeconds: 10,
          endTimeInSeconds: 1135
        }
      ]
    },
    {
      team: 'ColoColo',
      name: 'Player 2',
      moments: [
        {
          startTime: '04:20',
          duration: '9s',
          startTimeInSeconds: 260,
          durationInSeconds: 9,
          endTimeInSeconds: 269
        },
        {
          startTime: '10:15',
          duration: '14s',
          startTimeInSeconds: 615,
          durationInSeconds: 14,
          endTimeInSeconds: 629
        }
      ]
    }
  ],
  IndValle: [
    {
      team: 'IndValle',
      name: 'Goalkeeper',
      moments: [
        {
          startTime: '03:10',
          duration: '10s',
          startTimeInSeconds: 190,
          durationInSeconds: 10,
          endTimeInSeconds: 200
        },
        {
          startTime: '08:25',
          duration: '13s',
          startTimeInSeconds: 505,
          durationInSeconds: 13,
          endTimeInSeconds: 518
        }
      ]
    },
    {
      team: 'IndValle',
      name: 'Player 3',
      moments: [
        {
          startTime: '06:40',
          duration: '11s',
          startTimeInSeconds: 400,
          durationInSeconds: 11,
          endTimeInSeconds: 411
        },
        {
          startTime: '14:55',
          duration: '9s',
          startTimeInSeconds: 895,
          durationInSeconds: 9,
          endTimeInSeconds: 904
        }
      ]
    }
  ]
}

// State
const selectedPlayer = ref<string>('')
const youtubePlayer = ref<HTMLIFrameElement | null>(null)
const isVideoHighlighted = ref(false)
const isAutoPlaying = ref(false)
const currentMomentIndex = ref(0)
const countdown = ref(15)
const progressPercent = ref(0)

let autoPlayInterval: number | null = null
let countdownInterval: number | null = null

// Computed
const allPlayers = computed(() => {
  const coloColoPlayers = mockPlayerMoments.ColoColo || []
  const indVallePlayers = mockPlayerMoments.IndValle || []
  return [...coloColoPlayers, ...indVallePlayers]
})

const playerOptions = computed(() => {
  return allPlayers.value.map(player => ({
    name: `${player.team}-${player.name}`,
    label: `${player.name} (${player.team})`,
    team: player.team,
    playerName: player.name
  }))
})

const selectedPlayerData = computed(() => {
  if (!selectedPlayer.value) return null
  return playerOptions.value.find(p => p.name === selectedPlayer.value)
})

const currentMoments = computed(() => {
  if (!selectedPlayer.value) return []
  const player = allPlayers.value.find(p => `${p.team}-${p.name}` === selectedPlayer.value)
  return player?.moments || []
})

const youtubeEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${props.youtubeVideoId}?enablejsapi=1&rel=0&autoplay=0`
})

// Watch for player change - reset state
watch(selectedPlayer, () => {
  stopAutoPlay()
  currentMomentIndex.value = 0
  progressPercent.value = 0
})

// Functions
function goToMoment(index: number) {
  console.log(`🎬 Going to moment ${index + 1}`)

  currentMomentIndex.value = index
  const moment = currentMoments.value[index]

  if (!moment) return

  // Visual highlight
  isVideoHighlighted.value = true
  setTimeout(() => {
    isVideoHighlighted.value = false
  }, 2000)

  // Scroll to video
  scrollToVideo()

  // Jump to timestamp and play
  setTimeout(() => {
    seekAndPlay(moment.startTimeInSeconds)
  }, 600)

  // Reset countdown for auto-play
  if (isAutoPlaying.value) {
    resetCountdown()
  }
}

function seekAndPlay(timeInSeconds: number) {
  if (youtubePlayer.value && youtubePlayer.value.contentWindow) {
    // Seek to timestamp
    youtubePlayer.value.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [timeInSeconds, true]
      }),
      '*'
    )

    // Play
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
}

function scrollToVideo() {
  const videoCard = document.querySelector('.video-card')
  if (videoCard) {
    videoCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function startAutoPlay() {
  console.log('▶️ Starting auto-play')
  isAutoPlaying.value = true

  // Start with first moment if none selected
  if (currentMomentIndex.value === null || currentMomentIndex.value < 0) {
    goToMoment(0)
  } else {
    goToMoment(currentMomentIndex.value)
  }

  resetCountdown()
}

function stopAutoPlay() {
  console.log('⏸️ Stopping auto-play')
  isAutoPlaying.value = false
  clearIntervals()
  countdown.value = 15
  progressPercent.value = 0
}

function resetCountdown() {
  clearIntervals()
  countdown.value = 15
  progressPercent.value = 0

  // Countdown timer (updates every second)
  countdownInterval = window.setInterval(() => {
    countdown.value--
    progressPercent.value = 1 - (countdown.value / 15)

    if (countdown.value <= 0) {
      goToNextMoment()
    }
  }, 1000)
}

function goToNextMoment() {
  const nextIndex = currentMomentIndex.value + 1

  if (nextIndex < currentMoments.value.length) {
    goToMoment(nextIndex)
  } else {
    // Loop back to first moment
    goToMoment(0)
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
}

// Cleanup on unmount
onBeforeUnmount(() => {
  clearIntervals()
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
