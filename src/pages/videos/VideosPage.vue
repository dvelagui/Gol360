<template>
  <q-page class="videos-page q-pa-md">
    <div class="container">
      <!-- Header -->
      <div class="page-header q-mb-lg">
        <div class="row items-center justify-between">
          <div>
            <h1 class="text-h4 text-weight-bold q-mb-xs">
              <q-icon name="video_library" size="32px" class="q-mr-sm" />
              Encuentros
            </h1>
            <p class="text-subtitle1 text-grey-7">
              Revive los mejores momentos de cada partido
            </p>
          </div>
          <q-btn
            v-if="isAdmin"
            color="primary"
            icon="settings"
            label="Administrar Videos"
            @click="goToAdminPanel"
            unelevated
          />
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="filters-card q-mb-lg">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="selectedTournament"
                :options="tournamentOptions"
                label="Torneo"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="loadVideos"
              >
                <template #prepend>
                  <q-icon name="emoji_events" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="selectedType"
                :options="typeOptions"
                label="Tipo de video"
                outlined
                dense
                clearable
                @update:model-value="applyFilters"
              >
                <template #prepend>
                  <q-icon name="category" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <q-input
                v-model="searchTeam"
                label="Buscar equipo"
                outlined
                dense
                clearable
                debounce="300"
                @update:model-value="applyFilters"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <div class="row items-center q-gutter-sm">
                <q-toggle
                  v-model="showFeaturedOnly"
                  label="Solo destacados"
                  color="red"
                  @update:model-value="applyFilters"
                />
                <q-icon name="star" color="red" size="20px" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading -->
      <div v-if="loading" class="row justify-center q-py-xl">
        <q-spinner-hourglass color="primary" size="50px" />
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredVideos.length === 0" class="empty-state">
        <q-icon name="video_library" size="96px" class="text-grey-5 q-mb-md" />
        <div class="text-h6 text-grey-6 q-mb-sm">No hay videos disponibles</div>
        <div class="text-body2 text-grey-7">
          {{ selectedTournament ? 'Intenta cambiar los filtros de búsqueda' : 'Selecciona un torneo para ver los videos' }}
        </div>
      </div>

      <!-- Videos grid -->
      <div v-else class="videos-grid">
        <video-card
          v-for="video in filteredVideos"
          :key="video.id || `video-${Math.random()}`"
          :video="video"
          @click="openVideoPlayer(video)"
        />
      </div>

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
import type { MatchVideo, VideoType } from '@/services/videoService'
import videoService from '@/services/videoService'
import VideoCard from '@/components/videos/VideoCard.vue'
import VideoPlayerDialog from '@/components/videos/VideoPlayerDialog.vue'
import { useTournamentStore } from '@/stores/tournaments'
import { useDatabaseStore } from '@/stores/database'

const router = useRouter()
const tournamentsStore = useTournamentStore()
const databaseStore = useDatabaseStore()

const videos = ref<MatchVideo[]>([])
const loading = ref(false)
const selectedTournament = ref<string>('')
const selectedType = ref<VideoType | null>(null)
const searchTeam = ref('')
const showFeaturedOnly = ref(false)
const showPlayer = ref(false)
const selectedVideo = ref<MatchVideo | null>(null)

const isAdmin = computed(() => databaseStore.userData?.role === 'admin')

const tournamentOptions = computed(() => {
  return tournamentsStore.items.map((t: { displayName: string; id: string }) => ({
    label: t.displayName,
    value: t.id
  }))
})

const typeOptions = [
  { label: 'Resumen', value: 'highlights' },
  { label: 'Partido Completo', value: 'full-match' },
  { label: 'Goles', value: 'goals' },
  { label: 'Análisis', value: 'analysis' }
]

const filteredVideos = computed(() => {
  let result = [...videos.value]

  // Filtrar por tipo
  if (selectedType.value) {
    result = result.filter(v => v.videoType === selectedType.value)
  }

  // Filtrar por equipo
  if (searchTeam.value) {
    const search = searchTeam.value.toLowerCase()
    result = result.filter(v =>
      v.homeTeamName.toLowerCase().includes(search) ||
      v.awayTeamName.toLowerCase().includes(search)
    )
  }

  // Filtrar destacados
  if (showFeaturedOnly.value) {
    result = result.filter(v => v.featured)
  }

  return result
})

async function loadVideos() {
  if (!selectedTournament.value) return

  loading.value = true
  try {
    videos.value = await videoService.listVideosByTournament(selectedTournament.value)
  } catch (error) {
    console.error('Error loading videos:', error)
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  // Los filtros se aplican automáticamente via computed
}

function openVideoPlayer(video: MatchVideo) {
  selectedVideo.value = video
  showPlayer.value = true
}

function goToAdminPanel() {
  void router.push('/admin/videos/manage')
}

onMounted(async () => {
  // Cargar torneos si no están cargados
  if (tournamentsStore.items.length === 0) {
    await tournamentsStore.fetch()
  }

  // Seleccionar el primer torneo por defecto
  const firstTournament = tournamentOptions.value[0]
  if (firstTournament && !selectedTournament.value) {
    selectedTournament.value = firstTournament.value
    await loadVideos()
  }
})
</script>

<style scoped lang="scss">
.videos-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  h1 {
    display: flex;
    align-items: center;
  }
}

.filters-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 600px) {
  .videos-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    h1 {
      font-size: 1.75rem;
    }
  }
}
</style>
