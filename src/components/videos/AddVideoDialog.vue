<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 600px; max-width: 700px">
      <q-bar class="bg-primary text-white">
        <q-icon name="add_circle" />
        <div class="text-weight-bold q-ml-sm">Agregar Video del Partido</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup />
      </q-bar>

      <q-card-section>
        <div v-if="match" class="match-info q-pa-md q-mb-md">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">
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
          </div>
        </div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.youtubeUrl"
            label="URL de YouTube *"
            outlined
            :rules="[
              val => !!val || 'La URL es requerida',
              val => isValidYouTubeUrl(val) || 'URL de YouTube inválida'
            ]"
            lazy-rules
            @update:model-value="onUrlChange"
          >
            <template #prepend>
              <q-icon name="link" />
            </template>
            <template #hint>
              Ejemplo: https://www.youtube.com/watch?v=VIDEO_ID
            </template>
          </q-input>

          <!-- Preview del video -->
          <div v-if="videoPreviewId" class="video-preview">
            <div class="text-caption text-grey-7 q-mb-xs">Vista previa:</div>
            <div class="preview-container">
              <img
                :src="`https://img.youtube.com/vi/${videoPreviewId}/hqdefault.jpg`"
                alt="Preview"
                class="preview-image"
              />
              <q-icon name="play_circle" size="48px" color="white" class="play-icon" />
            </div>
          </div>

          <q-select
            v-model="form.videoType"
            :options="videoTypeOptions"
            label="Tipo de video *"
            outlined
            emit-value
            map-options
            :rules="[val => !!val || 'El tipo es requerido']"
          >
            <template #prepend>
              <q-icon name="category" />
            </template>
          </q-select>

          <q-input
            v-model="form.title"
            label="Título *"
            outlined
            :rules="[val => !!val || 'El título es requerido']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="title" />
            </template>
          </q-input>

          <q-input
            v-model="form.description"
            label="Descripción"
            type="textarea"
            outlined
            rows="3"
          >
            <template #prepend>
              <q-icon name="description" />
            </template>
          </q-input>

          <q-input
            v-model="form.duration"
            label="Duración"
            outlined
            mask="##:##"
            placeholder="05:30"
          >
            <template #prepend>
              <q-icon name="schedule" />
            </template>
            <template #hint>
              Formato: MM:SS
            </template>
          </q-input>

          <div class="row items-center">
            <q-checkbox
              v-model="form.featured"
              label="Marcar como destacado"
              color="red"
            />
            <q-icon name="star" color="red" size="20px" class="q-ml-xs" />
          </div>

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              label="Cancelar"
              flat
              color="grey-7"
              v-close-popup
            />
            <q-btn
              type="submit"
              label="Guardar Video"
              color="primary"
              icon-right="save"
              :loading="loading"
              :disable="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { Match } from '@/types/competition'
import type { VideoType } from '@/services/videoService'
import { createMatchVideo, extractYouTubeId } from '@/services/videoService'
import { useUserStore } from '@/stores/user'

interface Props {
  modelValue: boolean
  match: Match | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'video-added': []
}>()

const $q = useQuasar()
const userStore = useUserStore()

const form = ref({
  youtubeUrl: '',
  videoType: '' as VideoType | '',
  title: '',
  description: '',
  duration: '',
  featured: false
})

const loading = ref(false)
const videoPreviewId = ref<string | null>(null)

const videoTypeOptions = [
  { label: 'Resumen', value: 'highlights', icon: 'flash_on' },
  { label: 'Partido Completo', value: 'full-match', icon: 'sports_soccer' },
  { label: 'Goles', value: 'goals', icon: 'sports_score' },
  { label: 'Análisis', value: 'analysis', icon: 'analytics' }
]

// Auto-generar título cuando se selecciona el match o tipo
const autoTitle = computed(() => {
  if (!props.match) return ''
  const homeTeam = props.match.homeTeamId.name
  const awayTeam = props.match.awayTeamId.name
  const typeLabel = videoTypeOptions.find(opt => opt.value === form.value.videoType)?.label || 'Video'
  return `${typeLabel}: ${homeTeam} vs ${awayTeam}`
})

watch(() => props.match, (newMatch) => {
  if (newMatch && !form.value.title) {
    form.value.title = autoTitle.value
  }
})

watch(() => form.value.videoType, () => {
  if (props.match && autoTitle.value) {
    form.value.title = autoTitle.value
  }
})

function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}

function onUrlChange(url: string | number | null) {
  if (typeof url === 'string') {
    const videoId = extractYouTubeId(url)
    videoPreviewId.value = videoId
  }
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
    return typeof dateStr === 'string' ? dateStr : ''
  }
}

async function onSubmit() {
  if (!props.match || !userStore.user) return

  loading.value = true

  try {
    interface VideoDataBase {
      matchId: string
      tournamentId: string
      youtubeUrl: string
      videoType: VideoType
      title: string
      featured: boolean
      uploadedBy: string
      homeTeamName: string
      awayTeamName: string
      matchDate: string
      phase: string
      description?: string
      duration?: string
      round?: string
    }

    const videoData: VideoDataBase = {
      matchId: props.match.id || '',
      tournamentId: props.match.tournamentId,
      youtubeUrl: form.value.youtubeUrl,
      videoType: form.value.videoType as VideoType,
      title: form.value.title,
      featured: form.value.featured,
      uploadedBy: userStore.user.uid,
      homeTeamName: props.match.homeTeamId.name,
      awayTeamName: props.match.awayTeamId.name,
      matchDate: new Date(props.match.date).toISOString(),
      phase: props.match.phase
    }

    // Agregar campos opcionales solo si tienen valor
    if (form.value.description) videoData.description = form.value.description
    if (form.value.duration) videoData.duration = form.value.duration
    if (props.match.round) videoData.round = String(props.match.round)

    await createMatchVideo(videoData)

    $q.notify({
      type: 'positive',
      message: '¡Video agregado con éxito!',
      position: 'top',
      timeout: 2000
    })

    // Reset form
    form.value = {
      youtubeUrl: '',
      videoType: '',
      title: '',
      description: '',
      duration: '',
      featured: false
    }
    videoPreviewId.value = null

    emit('video-added')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Error adding video:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al agregar el video',
      caption: 'Por favor intenta de nuevo',
      position: 'top',
      timeout: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.match-info {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid rgba(25, 118, 210, 0.2);
}

.video-preview {
  .preview-container {
    position: relative;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .preview-image {
      width: 100%;
      display: block;
    }

    .play-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>
