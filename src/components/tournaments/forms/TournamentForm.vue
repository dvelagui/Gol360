<template>
  <q-card flat bordered class="rounded-2xl overflow-hidden">

    <q-card-section class="bg-primary text-white q-py-md">
      <div class="row items-center">
        <div class="col">
          <div class="text-subtitle1 text-weight-bold">Registrar Torneo</div>
          <div class="text-caption q-mt-xs" color="white">Completa los datos principales</div>
        </div>
        <q-btn dense round flat icon="close" v-close-popup class="text-white" />
      </div>
    </q-card-section>

    <q-separator />

    <q-form @submit.prevent="submit" class="q-gutter-md q-pa-md">

      <!-- Información Básica -->
      <div class="text-h6 text-primary q-mb-sm">Información Básica</div>

      <q-input v-model="form.displayName" label="Nombre del torneo *" :rules="[req]" filled dense>
        <template #prepend>
          <q-icon name="emoji_events" />
        </template>
      </q-input>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input v-model="form.city" label="Ciudad *" :rules="[req]" filled dense>
            <template #prepend>
              <q-icon name="location_city" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-input v-model="form.season" label="Temporada (ej: 2025)" filled dense>
            <template #prepend>
              <q-icon name="calendar_today" />
            </template>
          </q-input>
        </div>
      </div>

      <q-input v-model="form.category" label="Categoría (ej: Senior, Sub-17, Veteranos)" filled dense>
        <template #prepend>
          <q-icon name="category" />
        </template>
      </q-input>

      <q-input v-model="form.description" label="Descripción" type="textarea" rows="3" filled dense
        hint="Descripción breve del torneo">
        <template #prepend>
          <q-icon name="description" />
        </template>
      </q-input>

      <!-- Configuración del Torneo -->
      <div class="text-h6 text-primary q-mb-sm q-mt-md">Configuración</div>

      <q-select v-model="form.type" :options="championshipOptions" option-label="label" option-value="value"
        label="Tipo de campeonato *" emit-value map-options :rules="[req]" filled dense>
        <template #prepend>
          <q-icon name="sports" />
        </template>
      </q-select>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input v-model.number="form.numTeams" type="number" label="Número de equipos *" :rules="[positiveInt]" filled
            dense>
            <template #prepend>
              <q-icon name="groups" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-input v-model="form.startDate" label="Fecha de inicio" type="date" filled dense>
            <template #prepend>
              <q-icon name="event" />
            </template>
          </q-input>
        </div>
      </div>

      <q-select v-model="form.status" :options="statusOptions" option-label="label" option-value="value"
        label="Estado del torneo *" emit-value map-options :rules="[req]" filled dense>
        <template #prepend>
          <q-icon name="flag" />
        </template>
      </q-select>

      <!-- Organizador -->
      <div class="text-h6 text-primary q-mb-sm q-mt-md">Organizador</div>

      <q-select v-model="form.managerId" :options="managerOptions" label="Manager (organizador) *" emit-value map-options
        :rules="[req]" filled dense>
        <template #prepend>
          <q-icon name="person" />
        </template>
        <template #after>
          <q-btn dense color="accent" text-color="secondary" icon="add" @click="openNewManager">
            <q-tooltip>Crear nuevo manager</q-tooltip>
          </q-btn>
        </template>
      </q-select>

      <!-- Reglamento -->
      <div class="text-h6 text-primary q-mb-sm q-mt-md">Reglamento</div>

      <div>
        <div class="text-caption text-grey-7 q-mb-xs">Sube un archivo o ingresa la URL del reglamento</div>
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <q-file v-model="reglamentoFile" label="Subir documento (PDF, DOCX)" accept=".pdf,.doc,.docx" filled dense
              clearable @update:model-value="onFileSelected">
              <template #prepend>
                <q-icon name="upload_file" />
              </template>
            </q-file>
          </div>
          <div class="col-12 col-sm-1 text-center text-grey-6">
            <span>ó</span>
          </div>
          <div class="col-12 col-sm-5">
            <q-input v-model="form.rulesUrl" label="URL del reglamento" filled dense>
              <template #prepend>
                <q-icon name="link" />
              </template>
            </q-input>
          </div>
        </div>

        <div v-if="uploading" class="q-mt-sm">
          <q-linear-progress indeterminate color="primary" />
          <div class="text-caption text-center q-mt-xs">Subiendo archivo...</div>
        </div>

        <div v-if="form.rulesUrl && !uploading" class="q-mt-sm">
          <q-chip icon="check_circle" color="positive" text-color="white">
            Reglamento disponible
          </q-chip>
          <q-btn flat dense size="sm" icon="open_in_new" color="primary" :href="form.rulesUrl" target="_blank" class="q-ml-sm">
            Ver reglamento
          </q-btn>
        </div>
      </div>

      <!-- Premios (Opcional) -->
      <div class="text-h6 text-primary q-mb-sm q-mt-md">Premios (Opcional)</div>

      <div v-if="form.award" class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input v-model.number="form.award.first_place" type="number" label="1er Lugar ($)" filled dense min="0">
            <template #prepend>
              <q-icon name="emoji_events" color="yellow-8" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-input v-model.number="form.award.second_place" type="number" label="2do Lugar ($)" filled dense min="0">
            <template #prepend>
              <q-icon name="emoji_events" color="grey-6" />
            </template>
          </q-input>
        </div>
      </div>

      <div v-if="form.award" class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input v-model.number="form.award.top_scorer" type="number" label="Goleador ($)" filled dense min="0">
            <template #prepend>
              <q-icon name="sports_soccer" color="orange" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-input v-model.number="form.award.defeat_net" type="number" label="Valla menos vencida ($)" filled dense min="0">
            <template #prepend>
              <q-icon name="shield" color="blue" />
            </template>
          </q-input>
        </div>
      </div>

      <!-- Imagen del Torneo (Opcional) -->
      <div class="text-h6 text-primary q-mb-sm q-mt-md">Imagen (Opcional)</div>

      <q-file v-model="photoFile" label="Logo o imagen del torneo" accept="image/*" filled dense clearable
        @update:model-value="onPhotoSelected">
        <template #prepend>
          <q-icon name="image" />
        </template>
      </q-file>

      <div v-if="uploadingPhoto" class="q-mt-sm">
        <q-linear-progress indeterminate color="primary" />
        <div class="text-caption text-center q-mt-xs">Subiendo imagen...</div>
      </div>

      <div v-if="form.photoURL && !uploadingPhoto" class="q-mt-sm">
        <q-avatar size="80px" square>
          <img :src="form.photoURL" alt="Logo del torneo" />
        </q-avatar>
      </div>

      <!-- Botones de Acción -->
      <div class="row justify-end q-gutter-sm q-mt-lg q-pt-md" style="border-top: 1px solid #e0e0e0;">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn color="accent" text-color="secondary" label="Guardar Torneo" icon="save" type="submit" :loading="saving" />
      </div>
    </q-form>

    <ManagerFormDialog v-model="showOrgDialog" @created="onManagerCreated" />

  </q-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Notify } from 'quasar'
import { req, positiveInt } from '@/utils/formValidators'
import { getDocs } from 'firebase/firestore'
import { colManagers } from '@/services/firestore/collections'
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { Tournament } from '@/types/auth'
import { defineAsyncComponent } from 'vue'
const ManagerFormDialog = defineAsyncComponent(() => import('@/components/tournaments/dialogs/ManagerFormDialog.vue'))


/** Opciones normalizadas para el tipo de campeonato */
const championshipOptions = [
  { label: 'Todos contra todos', value: 'league' },
  { label: 'Todos contra todos + eliminatoria', value: 'league_playoff' },
  { label: 'Eliminatoria', value: 'playoff' }
] as const

/** Opciones de estado del torneo */
const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Finalizado', value: 'finished' }
] as const

const saving = ref(false)
const showOrgDialog = ref(false)
const managerOptions = ref<{ label: string, value: string }[]>([])
const reglamentoFile = ref<File | null>(null)
const uploading = ref(false)
const photoFile = ref<File | null>(null)
const uploadingPhoto = ref(false)

/** Modelo del formulario (compat. con tu tipo Tournament) */
const form = reactive<Partial<Tournament>>({
  displayName: '',
  city: '',
  type: '',
  season: '',
  category: '',
  rulesUrl: '',
  description: '',
  numTeams: 0,
  startDate: '',
  managerId: '',
  managerName: '',
  status: 'pending',
  photoURL: '',
  award: {
    first_place: 0,
    second_place: 0,
    top_scorer: 0,
    defeat_net: 0
  }
})


onMounted(async () => {
  const snaps = await getDocs(colManagers)
  managerOptions.value = snaps.docs.map(d => ({ label: d.data().displayName, value: d.id }))
})

function openNewManager() { showOrgDialog.value = true }

function onManagerCreated(opt: { id: string; label: string; value: string }) {
  managerOptions.value.push({ label: opt.label, value: opt.value })
  form.managerId = opt.value
  form.managerName = opt.label

}
/** Sube archivo a Storage y setea rulesUrl */
async function onFileSelected(file: File | File[] | null) {
  if (!file) return
  const f = Array.isArray(file) ? file[0] : file
  if (!f) return

  try {
    uploading.value = true
    const storage = getStorage()
    // usamos nombre lógico con timestamp
    const path = `tournaments/_pending/rules/${Date.now()}-${f.name}`
    const ref = sRef(storage, path)
    await uploadBytes(ref, f)
    const url = await getDownloadURL(ref)
    form.rulesUrl = url
    Notify.create({ type: 'positive', message: 'Reglamento cargado correctamente' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo subir el reglamento'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    uploading.value = false
  }
}

/** Sube foto a Storage y setea photoURL */
async function onPhotoSelected(file: File | File[] | null) {
  if (!file) return
  const f = Array.isArray(file) ? file[0] : file
  if (!f) return

  try {
    uploadingPhoto.value = true
    const storage = getStorage()
    // usamos nombre lógico con timestamp
    const path = `tournaments/_pending/photos/${Date.now()}-${f.name}`
    const ref = sRef(storage, path)
    await uploadBytes(ref, f)
    const url = await getDownloadURL(ref)
    form.photoURL = url
    Notify.create({ type: 'positive', message: 'Foto cargada correctamente' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo subir la foto'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    uploadingPhoto.value = false
  }
}


const emit = defineEmits<{ (e: 'submit', payload: Partial<Tournament>): void }>()

function submit() {
  saving.value = true
  emit('submit', form)
  saving.value = false
}
</script>

<style scoped lang="scss">
.rounded-2xl {
  border-radius: 16px;
}
</style>
