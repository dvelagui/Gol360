<template>
  <q-card flat bordered class="video-card" @click="$emit('click', video)">
    <div class="video-thumbnail">
      <img
        :src="video.thumbnailUrl || `https://img.youtube.com/vi/${getVideoId()}/hqdefault.jpg`"
        :alt="video.title"
      />
      <div class="video-overlay">
        <q-icon name="play_circle" size="64px" color="white" />
      </div>
      <q-badge
        v-if="video.featured"
        color="red"
        floating
        class="featured-badge"
      >
        <q-icon name="star" size="16px" />
        Destacado
      </q-badge>
      <q-badge
        v-if="video.duration"
        color="black"
        class="duration-badge"
      >
        {{ video.duration }}
      </q-badge>
    </div>

    <q-card-section>
      <div class="video-type-badge q-mb-sm">
        <q-chip
          :color="getTypeColor(video.videoType)"
          text-color="white"
          size="sm"
          dense
        >
          <q-icon :name="getTypeIcon(video.videoType)" size="16px" class="q-mr-xs" />
          {{ getTypeLabel(video.videoType) }}
        </q-chip>
      </div>

      <div class="text-h6 text-weight-bold q-mb-xs ellipsis-2-lines">
        {{ video.title }}
      </div>

      <div class="match-teams q-mb-sm">
        <div class="text-subtitle2 text-grey-8">
          <span class="text-weight-medium">{{ video.homeTeamName }}</span>
          <span class="text-grey-6 q-mx-xs">vs</span>
          <span class="text-weight-medium">{{ video.awayTeamName }}</span>
        </div>
      </div>

      <div class="video-meta row items-center q-gutter-sm text-grey-7">
        <div class="row items-center">
          <q-icon name="event" size="16px" class="q-mr-xs" />
          <span class="text-caption">{{ formatDate(video.matchDate) }}</span>
        </div>
        <q-separator vertical />
        <div v-if="video.views !== undefined" class="row items-center">
          <q-icon name="visibility" size="16px" class="q-mr-xs" />
          <span class="text-caption">{{ video.views }} vistas</span>
        </div>
      </div>

      <div v-if="video.description" class="text-caption text-grey-7 q-mt-sm ellipsis-2-lines">
        {{ video.description }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { MatchVideo, VideoType } from '@/services/videoService'
import { extractYouTubeId } from '@/services/videoService'

interface Props {
  video: MatchVideo
}

const props = defineProps<Props>()

defineEmits<{
  click: [video: MatchVideo]
}>()

function getVideoId(): string {
  return extractYouTubeId(props.video.youtubeUrl) || ''
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
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}
</script>

<style scoped lang="scss">
.video-card {
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);

    .video-overlay {
      opacity: 1;
    }
  }
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 56.25%; // 16:9 aspect ratio
  overflow: hidden;
  background: #000;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.featured-badge {
  top: 8px;
  left: 8px;
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4em;
  max-height: 2.8em;
}

.match-teams {
  border-left: 3px solid var(--q-primary);
  padding-left: 8px;
}

.video-meta {
  font-size: 0.75rem;
}
</style>
