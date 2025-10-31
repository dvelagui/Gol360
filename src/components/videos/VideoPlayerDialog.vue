<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="video-player-card">
      <q-bar class="bg-primary text-white">
        <q-icon name="video_library" />
        <div class="text-weight-bold q-ml-sm ellipsis">{{ video?.title }}</div>
        <q-space />
        <q-btn
          dense
          flat
          icon="open_in_new"
          @click="openInYouTube"
        >
          <q-tooltip>Abrir en YouTube</q-tooltip>
        </q-btn>
        <q-btn dense flat icon="close" v-close-popup />
      </q-bar>

      <q-card-section class="q-pa-none video-container">
        <iframe
          v-if="video && videoId"
          :src="`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          class="video-iframe"
        />
        <div v-else class="no-video">
          <q-icon name="error_outline" size="64px" class="q-mb-md text-grey-5" />
          <div class="text-h6 text-grey-6">No se pudo cargar el video</div>
        </div>
      </q-card-section>

      <q-card-section v-if="video">
        <div class="row items-start q-col-gutter-md">
          <div class="col-12 col-md-8">
            <div class="text-h5 text-weight-bold q-mb-sm">
              {{ video.title }}
            </div>

            <div class="row items-center q-gutter-sm q-mb-md">
              <q-chip
                :color="getTypeColor(video.videoType)"
                text-color="white"
                size="md"
              >
                <q-icon :name="getTypeIcon(video.videoType)" size="20px" class="q-mr-xs" />
                {{ getTypeLabel(video.videoType) }}
              </q-chip>

              <q-badge v-if="video.featured" color="red">
                <q-icon name="star" size="16px" class="q-mr-xs" />
                Destacado
              </q-badge>

              <q-separator vertical />

              <div class="text-caption text-grey-7">
                <q-icon name="visibility" size="16px" class="q-mr-xs" />
                {{ video.views || 0 }} vistas
              </div>
            </div>

            <div v-if="video.description" class="description-box q-pa-md q-mb-md">
              <div class="text-body2">{{ video.description }}</div>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1 text-weight-bold q-mb-md">
                  <q-icon name="sports_soccer" class="q-mr-xs" />
                  Detalles del Partido
                </div>

                <div class="match-detail q-mb-sm">
                  <div class="text-caption text-grey-7">Equipos</div>
                  <div class="text-weight-medium">
                    {{ video.homeTeamName }}
                    <span class="text-grey-6 q-mx-xs">vs</span>
                    {{ video.awayTeamName }}
                  </div>
                </div>

                <q-separator class="q-my-sm" />

                <div class="match-detail q-mb-sm">
                  <div class="text-caption text-grey-7">Fecha</div>
                  <div class="text-weight-medium">
                    <q-icon name="event" size="16px" class="q-mr-xs" />
                    {{ formatDate(video.matchDate) }}
                  </div>
                </div>

                <div v-if="video.round" class="match-detail q-mb-sm">
                  <q-separator class="q-my-sm" />
                  <div class="text-caption text-grey-7">Jornada</div>
                  <div class="text-weight-medium">{{ video.round }}</div>
                </div>

                <div v-if="video.phase" class="match-detail">
                  <q-separator class="q-my-sm" />
                  <div class="text-caption text-grey-7">Fase</div>
                  <div class="text-weight-medium">{{ video.phase }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { MatchVideo, VideoType } from '@/services/videoService'
import { extractYouTubeId, incrementVideoViews } from '@/services/videoService'

interface Props {
  modelValue: boolean
  video: MatchVideo | null
}

const props = defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const videoId = computed(() => {
  return props.video ? extractYouTubeId(props.video.youtubeUrl) : null
})

// Incrementar vistas cuando se abre el diálogo
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.video?.id) {
    void incrementVideoViews(props.video.id)
  }
})

function openInYouTube() {
  if (props.video) {
    window.open(props.video.youtubeUrl, '_blank')
  }
}

function getTypeLabel(type: VideoType): string {
  const labels: Record<VideoType, string> = {
    highlights: 'Resumen',
    'full-match': 'Partido Completo',
    goals: 'Goles',
    analysis: 'Análisis'
  }
  return labels[type] || type
}

function getTypeIcon(type: VideoType): string {
  const icons: Record<VideoType, string> = {
    highlights: 'flash_on',
    'full-match': 'sports_soccer',
    goals: 'sports_score',
    analysis: 'analytics'
  }
  return icons[type] || 'video_library'
}

function getTypeColor(type: VideoType): string {
  const colors: Record<VideoType, string> = {
    highlights: 'orange',
    'full-match': 'blue',
    goals: 'red',
    analysis: 'purple'
  }
  return colors[type] || 'grey'
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}
</script>

<style scoped lang="scss">
.video-player-card {
  background: #f5f5f5;
}

.video-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; // 16:9 aspect ratio
  background: #000;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.no-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.description-box {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.match-detail {
  .text-caption {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
