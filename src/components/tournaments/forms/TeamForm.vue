<template>
  <q-form @submit.prevent="onSubmit" class="team-form">
    <!-- Avatar Section - Destacado arriba -->
    <div class="avatar-section q-mb-lg">
      <div class="text-subtitle2 text-grey-8 q-mb-md">
        <q-icon name="shield" class="q-mr-xs" />
        Escudo del Equipo
      </div>
      <div class="avatar-content">
        <div class="avatar-preview-wrapper">
          <div class="avatar-container">
            <q-avatar size="120px" class="avatar-preview">
              <q-img :src="previewURL" ratio="1" />
            </q-avatar>
            <div class="avatar-overlay" v-if="!localFile">
              <q-icon name="add_photo_alternate" size="32px" class="text-grey-5" />
            </div>
          </div>
        </div>
        <div class="avatar-upload-wrapper">
          <q-file
            v-model="localFile"
            accept="image/*"
            label="Seleccionar imagen"
            outlined
            clearable
            counter
            max-file-size="5242880"
            @update:model-value="onFileChange"
            @rejected="onFileRejected"
          >
            <template #prepend>
              <q-icon name="image" />
            </template>
            <template #hint>
              PNG o JPG (máx. 5MB)
            </template>
          </q-file>
          <div class="text-caption text-grey-6 q-mt-sm">
            💡 Si no subes una imagen, usaremos un escudo por defecto
          </div>
        </div>
      </div>
    </div>

    <q-separator class="q-mb-lg" />

    <!-- Form Fields -->
    <div class="form-section">
      <div class="text-subtitle2 text-grey-8 q-mb-md">
        <q-icon name="info" class="q-mr-xs" />
        Información del Equipo
      </div>

      <div class="row q-col-gutter-md">
        <!-- Nombre del equipo -->
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.displayName"
            label="Nombre del equipo *"
            :rules="[req]"
            outlined
            counter
            maxlength="50"
            hint="Nombre oficial del equipo"
          >
            <template #prepend>
              <q-icon name="groups" />
            </template>
          </q-input>
        </div>

        <!-- Ciudad -->
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.city"
            label="Ciudad *"
            :rules="[req]"
            outlined
            hint="Ciudad de origen del equipo"
          >
            <template #prepend>
              <q-icon name="location_city" />
            </template>
          </q-input>
        </div>

        <!-- Grupo (opcional) -->
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.group"
            label="Grupo (opcional)"
            outlined
            hint="Ej: A, B, C..."
            maxlength="10"
          >
            <template #prepend>
              <q-icon name="category" />
            </template>
          </q-input>
        </div>

        <!-- Color primario -->
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.colors"
            label="Color primario (opcional)"
            outlined
            hint="Color principal de la camiseta"
          >
            <template #prepend>
              <q-icon name="palette" />
            </template>
            <template #append>
              <q-icon name="circle" :style="{ color: form.colors || '#ccc' }" size="24px" />
            </template>
          </q-input>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <q-btn
        flat
        label="Cancelar"
        color="grey-7"
        class="btn-cancel"
        @click="$emit('cancel')"
      />
      <q-btn
        :loading="submitting"
        unelevated
        color="primary"
        label="Guardar Equipo"
        icon-right="save"
        class="btn-save"
        type="submit"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { uploadImage } from '@/services/uploadService'
import { Notify } from 'quasar'
import type { Team } from '@/types/auth'

type UploadResult = string | { url: string; path: string }

// Avatar por defecto (teams)
const DEFAULT_TEAM_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/gol360-app.firebasestorage.app/o/avatar%2Fteam.png?alt=media&token=b3aa0ba4-ee43-4b2c-b34d-7ddb86c77aa8'

const props = defineProps<{
  tournamentId: string
  modelValue?: Partial<Team>  // para edición
}>()

const emit = defineEmits<{
  (e: 'save', payload: Omit<Team,'id'|'createdAt'|'createdBy'> & { __storagePath__?: string }): void
  (e: 'cancel'): void
}>()

// reglas simples
const req = (v: string) => (!!v && v.toString().trim().length > 0) || 'Requerido'

const submitting = ref(false)
const localFile = ref<File | null>(null)
const storedPath = ref<string | undefined>(undefined)

const form = ref<Omit<Team,'id'|'createdAt'|'createdBy'>>({
  tournamentId: props.tournamentId,
  displayName: props.modelValue?.displayName ?? '',
  city: props.modelValue?.city ?? '',
  group: props.modelValue?.group ?? '',
  colors: props.modelValue?.colors ?? '',
  // nuevo nombre de campo:
  photoURL: (props.modelValue as Partial<Team>)?.photoURL
    ?? (props.modelValue as Partial<Team>)?.crestUrl
    ?? DEFAULT_TEAM_AVATAR,
  captainId: props.modelValue?.captainId ?? ''
})

// si viene desde BD un path guardado (si ya lo manejas), consérvalo
watch(() => (props.modelValue as Partial<Team> & { __storagePath__?: string })?.__storagePath__, (p) => { storedPath.value = p }, { immediate: true })

const previewURL = computed(() => {
  return localFile.value ? URL.createObjectURL(localFile.value) : (form.value.photoURL || DEFAULT_TEAM_AVATAR)
})

function onFileChange (f: File | null) {
  // solo para refrescar preview; la subida se hace onSubmit
  if (!f) return
}

function onFileRejected () {
  Notify.create({
    type: 'negative',
    message: 'Archivo no válido. Debe ser una imagen menor a 5MB',
    position: 'top'
  })
}

/** Sube imagen (si hay) y emite el payload listo.
 *  Para _compat_ dejamos también `crestUrl` en el objeto que emitimos.
 */
async function onSubmit () {
  try {
    submitting.value = true

    let photoURL = form.value.photoURL || DEFAULT_TEAM_AVATAR
    let path: string | undefined = undefined
    if (localFile.value) {
      const up = await uploadImage(
        localFile.value,
        'teams'
      ) as UploadResult
      if (typeof up === 'string') {
        photoURL = up
      } else if (up && typeof up === 'object' && 'url' in up && 'path' in up) {
        photoURL = up.url
        path = up.path
      }
    }

    const payload = {
      ...form.value,
      tournamentId: props.tournamentId,
      photoURL,
      // compat con vistas/servicios antiguos:
      crestUrl: photoURL,
      ...(path ? { __storagePath__: path } : {})
    }

    emit('save', payload)
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo guardar el equipo' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.team-form {
  width: 100%;
}

.avatar-section {
  padding: 20px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.03) 0%, rgba(25, 118, 210, 0.08) 100%);
  border-radius: 12px;
  border: 1px solid rgba(25, 118, 210, 0.1);
}

.avatar-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview-wrapper {
  flex-shrink: 0;
}

.avatar-upload-wrapper {
  flex: 1;
  min-width: 0; // Importante para que el flex funcione correctamente
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-preview {
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #f5f5f5;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    transform: scale(1.02);
  }
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  pointer-events: none;
}

.form-section {
  .text-subtitle2 {
    font-weight: 600;
  }
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  padding: 10px 24px;
  min-width: 100px;
}

.btn-save {
  padding: 10px 32px;
  min-width: 140px;
  font-weight: 600;
}

@media (max-width: 600px) {
  .avatar-section {
    padding: 16px;
  }

  .avatar-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .avatar-preview-wrapper {
    width: 100%;
  }

  .avatar-upload-wrapper {
    width: 100%;
  }

  .avatar-preview {
    width: 100px !important;
    height: 100px !important;
    font-size: 100px !important;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
    margin-top: 24px;
    padding-top: 16px;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
    padding: 12px 16px;
    min-width: unset;
  }
}
</style>
