<template>
  <q-form @submit.prevent="onSubmit" class="q-gutter-md">
    <div class="row justify-center q-col-gutter-md">
      <div class="col-11 col-md-5">
        <q-input
          v-model="form.displayName"
          label="Nombre del equipo"
          :rules="[req]"
          dense filled
        />
      </div>
      <div class="col-11 col-md-5">
        <q-input
          v-model="form.city"
          label="Ciudad"
          :rules="[req]"
          dense filled
        />
      </div>

      <div class="col-11 col-md-5">
        <q-input
          v-model="form.colors"
          label="Color primario de grupo (opcional)"
          :rules="[req]"
          dense filled
        />
      </div>

      <div class="col-11 col-md-5">
        <div class="row items-center q-gutter-md">
          <div>
            <q-avatar size="72px" color="grey-2">
              <q-img :src="previewURL" ratio="1" />
            </q-avatar>
          </div>
          <div class="col">
            <q-file
              v-model="localFile"
              accept="image/*"
              label="Subir Escudo / logo"
              dense filled
              clearable
              @update:model-value="onFileChange"
            >
              <template #prepend><q-icon name="image"/></template>
            </q-file>
            <div class="text-caption text-grey-7 q-mt-xs">
              PNG/JPG recomendado. Si no cargas una imagen, usaremos un avatar por defecto.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row justify-end q-gutter-sm">
      <q-btn flat label="Cancelar" color="grey-7" @click="$emit('cancel')" />
      <q-btn :loading="submitting" color="primary" label="Guardar" type="submit" />
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
