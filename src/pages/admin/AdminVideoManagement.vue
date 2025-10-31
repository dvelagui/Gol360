<template>
  <q-page class="admin-video-management q-pa-md">
    <div class="container">
      <!-- Header -->
      <div class="page-header q-mb-lg">
        <div class="row items-center justify-between">
          <div>
            <h1 class="text-h4 text-weight-bold q-mb-xs">
              <q-icon name="video_settings" size="32px" class="q-mr-sm" />
              Administración de Videos
            </h1>
            <p class="text-subtitle1 text-grey-7">
              Agrega y administra los videos de los partidos
            </p>
          </div>
          <q-btn
            color="secondary"
            icon="arrow_back"
            label="Volver a Videos"
            @click="goBack"
            flat
          />
        </div>
      </div>

      <!-- Tournament Selector -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-md-6">
              <q-select
                v-model="selectedTournament"
                :options="tournamentOptions"
                label="Selecciona un torneo"
                outlined
                emit-value
                map-options
                @update:model-value="loadMatches"
              >
                <template #prepend>
                  <q-icon name="emoji_events" />
                </template>
              </q-select>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="searchMatch"
                label="Buscar partido"
                outlined
                clearable
                debounce="300"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading -->
      <div v-if="loading" class="row justify-center q-py-xl">
        <q-spinner-hourglass color="primary" size="50px" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!selectedTournament" class="empty-state">
        <q-icon name="emoji_events" size="96px" class="text-grey-5 q-mb-md" />
        <div class="text-h6 text-grey-6">Selecciona un torneo para comenzar</div>
      </div>

      <!-- Matches list -->
      <div v-else-if="filteredMatches.length === 0" class="empty-state">
        <q-icon name="sports_soccer" size="96px" class="text-grey-5 q-mb-md" />
        <div class="text-h6 text-grey-6">No hay partidos disponibles</div>
      </div>

      <div v-else class="matches-list">
        <q-card
          v-for="match in filteredMatches"
          :key="match.id"
          flat
          bordered
          class="match-card q-mb-md"
        >
          <q-card-section>
            <div class="row items-center q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="match-info">
                  <div class="text-h6 text-weight-bold q-mb-xs">
                    {{ match.homeTeamId.name }}
                    <span class="text-grey-6 q-mx-sm">vs</span>
                    {{ match.awayTeamId.name }}
                  </div>
                  <div class="text-caption text-grey-7">
                    <q-icon name="event" size="16px" class="q-mr-xs" />
                    {{ formatDate(match.date) }}
                    <span v-if="match.round" class="q-ml-sm">
                      • Jornada {{ match.round }}
                    </span>
                    <span v-if="match.phase" class="q-ml-sm">
                      • {{ match.phase }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="row items-center justify-end q-gutter-sm">
                  <q-chip
                    v-if="getMatchVideosCount(match.id || '')"
                    color="primary"
                    text-color="white"
                    icon="video_library"
                  >
                    {{ getMatchVideosCount(match.id || '') }} video(s)
                  </q-chip>
                  <q-btn
                    color="primary"
                    icon="add"
                    label="Agregar Video"
                    @click="openAddVideoDialog(match)"
                    unelevated
                  />
                  <q-btn
                    v-if="getMatchVideosCount(match.id || '')"
                    color="secondary"
                    icon="visibility"
                    label="Ver Videos"
                    @click="openMatchVideos(match)"
                    outline
                  />
                </div>
              </div>
            </div>

            <!-- Existing videos for this match -->
            <div v-if="getMatchVideos(match.id || '').length > 0" class="match-videos q-mt-md">
              <q-separator class="q-mb-md" />
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Videos existentes:</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="video in getMatchVideos(match.id || '')"
                  :key="video.id || `video-${Math.random()}`"
                  class="col-12"
                >
                  <q-card flat bordered class="video-item">
                    <q-card-section horizontal>
                      <q-card-section class="col">
                        <div class="row items-center q-gutter-sm">
                          <q-chip
                            :color="getTypeColor(video.videoType)"
                            text-color="white"
                            size="sm"
                            dense
                          >
                            {{ getTypeLabel(video.videoType) }}
                          </q-chip>
                          <q-badge v-if="video.featured" color="red">
                            <q-icon name="star" size="14px" />
                          </q-badge>
                          <span class="text-weight-medium">{{ video.title }}</span>
                          <q-space />
                          <span class="text-caption text-grey-7">
                            <q-icon name="visibility" size="14px" />
                            {{ video.views || 0 }}
                          </span>
                        </div>
                      </q-card-section>
                      <q-separator vertical />
                      <q-card-actions vertical>
                        <q-btn
                          flat
                          dense
                          icon="edit"
                          @click="editVideo(video)"
                        >
                          <q-tooltip>Editar</q-tooltip>
                        </q-btn>
                        <q-btn
                          flat
                          dense
                          icon="delete"
                          color="negative"
                          @click="confirmDeleteVideo(video)"
                        >
                          <q-tooltip>Eliminar</q-tooltip>
                        </q-btn>
                      </q-card-actions>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Add Video Dialog -->
      <add-video-dialog
        v-model="showAddDialog"
        :match="selectedMatch"
        @video-added="onVideoAdded"
      />

      <!-- Video Player Dialog -->
      <video-player-dialog
        v-model="showPlayer"
        :video="selectedVideo"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { Match } from '@/types/competition'
import type { MatchVideo, VideoType } from '@/services/videoService'
import videoService from '@/services/videoService'
import AddVideoDialog from '@/components/videos/AddVideoDialog.vue'
import VideoPlayerDialog from '@/components/videos/VideoPlayerDialog.vue'
import { useMatchStore } from '@/stores/matches'
import { useTournamentStore } from '@/stores/tournaments'

const router = useRouter()
const $q = useQuasar()
const matchesStore = useMatchStore()
const tournamentsStore = useTournamentStore()

const loading = ref(false)
const selectedTournament = ref<string>('')
const searchMatch = ref('')
const selectedMatch = ref<Match | null>(null)
const selectedVideo = ref<MatchVideo | null>(null)
const showAddDialog = ref(false)
const showPlayer = ref(false)
const matchVideos = ref<MatchVideo[]>([])

const tournamentOptions = computed(() => {
  return tournamentsStore.items.map((t: { displayName: string; id: string }) => ({
    label: t.displayName,
    value: t.id
  }))
})

const filteredMatches = computed(() => {
  if (!searchMatch.value) return matchesStore.items

  const search = searchMatch.value.toLowerCase()
  return matchesStore.items.filter((m: Match) =>
    m.homeTeamId.name.toLowerCase().includes(search) ||
    m.awayTeamId.name.toLowerCase().includes(search)
  )
})

async function loadMatches() {
  if (!selectedTournament.value) return

  loading.value = true
  try {
    await matchesStore.fetch(selectedTournament.value)
    // Load all videos for this tournament
    matchVideos.value = await videoService.listVideosByTournament(selectedTournament.value)
  } catch (error) {
    console.error('Error loading matches:', error)
  } finally {
    loading.value = false
  }
}

function getMatchVideos(matchId: string): MatchVideo[] {
  return matchVideos.value.filter(v => v.matchId === matchId)
}

function getMatchVideosCount(matchId: string): number {
  return getMatchVideos(matchId).length
}

function openAddVideoDialog(match: Match) {
  selectedMatch.value = match
  showAddDialog.value = true
}

function openMatchVideos(match: Match) {
  const videos = getMatchVideos(match.id || '')
  if (videos.length > 0 && videos[0]) {
    selectedVideo.value = videos[0]
    showPlayer.value = true
  }
}

function editVideo(video: MatchVideo) {
  selectedVideo.value = video
  // TODO: Implement edit functionality
  $q.notify({
    type: 'info',
    message: 'Función de edición próximamente',
    position: 'top'
  })
}

function confirmDeleteVideo(video: MatchVideo) {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de eliminar el video "${video.title}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    void (async () => {
      try {
        await videoService.deleteMatchVideo(video.id || '')
        matchVideos.value = matchVideos.value.filter(v => v.id !== video.id)
        $q.notify({
          type: 'positive',
          message: 'Video eliminado con éxito',
          position: 'top'
        })
      } catch (error) {
        console.error('Error deleting video:', error)
        $q.notify({
          type: 'negative',
          message: 'Error al eliminar el video',
          position: 'top'
        })
      }
    })()
  })
}

async function onVideoAdded() {
  // Reload videos
  if (selectedTournament.value) {
    matchVideos.value = await videoService.listVideosByTournament(selectedTournament.value)
  }
}

function goBack() {
  void router.push('/admin/videos')
}

function formatDate(dateStr: string | number): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return typeof dateStr === 'string' ? dateStr : String(dateStr)
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

function getTypeColor(type: VideoType): string {
  const colors: Record<VideoType, string> = {
    highlights: 'orange',
    'full-match': 'blue',
    goals: 'red',
    analysis: 'purple'
  }
  return colors[type] || 'grey'
}

onMounted(async () => {
  // Cargar torneos si no están cargados
  if (tournamentsStore.items.length === 0) {
    await tournamentsStore.fetch()
  }

  // Seleccionar el primer torneo por defecto
  const firstTournament = tournamentOptions.value[0]
  if (firstTournament) {
    selectedTournament.value = firstTournament.value
    await loadMatches()
  }
})
</script>

<style scoped lang="scss">
.admin-video-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  h1 {
    display: flex;
    align-items: center;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}

.match-card {
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.video-item {
  background: #f9f9f9;
}

@media (max-width: 600px) {
  .page-header {
    h1 {
      font-size: 1.5rem;
    }
  }
}
</style>
