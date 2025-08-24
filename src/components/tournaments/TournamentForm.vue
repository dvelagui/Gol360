<template>
  <q-card flat bordered class="rounded-2xl overflow-hidden">

    <!-- Header estilo mock -->
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

      <!-- Nombre, ciudad -->
      <q-input v-model="form.displayName" label="Nombre del torneo" :rules="[req]" filled dense />
      <q-input v-model="form.city" label="Ciudad" :rules="[req]" filled dense />

      <!-- Tipo de campeonato (con valores normalizados) -->
      <q-select v-model="form.type" :options="championshipOptions" option-label="label" option-value="value"
        label="Tipo de campeonato" emit-value map-options :rules="[req]" filled dense />

      <!-- Category opcional -->
      <q-input v-model="form.category" label="Categoría (opcional)" filled dense />

      <!-- Reglamento (archivo) opcional -->
      <div>
        <div class="text-caption q-mb-xs">Reglamento (opcional)</div>
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <q-file v-model="reglamentoFile" label="Subir documento (PDF, DOCX)" accept=".pdf,.doc,.docx" filled dense
              clearable @update:model-value="onFileSelected">
              <template #prepend>
                <q-icon name="upload_file" />
              </template>
            </q-file>
          </div>
          <div class="col-12 col-sm-1 text-center">
            <span>ó</span>
          </div>
          <div class="col-12 col-sm-5">
            <q-input v-model="form.rulesUrl" label="URL del reglamento" filled dense />
          </div>
        </div>

        <div v-if="uploading" class="q-mt-xs">
          <q-linear-progress indeterminate color="primary" />
        </div>

        <div v-if="form.rulesUrl && !uploading" class="q-mt-xs">
          <q-chip icon="description" color="primary" text-color="white" square>
            Reglamento cargado
          </q-chip>
        </div>
      </div>

      <!-- Descripción breve opcional -->
      <q-input v-model="form.description" label="Descripción breve (opcional)" type="textarea" autogrow filled dense />

      <!-- Número de equipos -->
      <q-input v-model.number="form.numTeams" type="number" label="Número de equipos" :rules="[positiveInt]" filled
        dense />

      <!-- Fecha de inicio (opcional; déjalo si lo necesitas en tu flujo) -->
      <q-input v-model="form.startDate" label="Fecha de inicio (opcional)" type="date" filled dense />

      <!-- Manager -->
      <q-select v-model="form.managerId" :options="managerOptions" label="Manager (organizador)" emit-value map-options
        :rules="[req]" filled dense>
        <template #after>
          <q-btn dense color="accent" text-color="secondary" class="q-ml-sm" label="Nuevo Manager"
            @click="openNewManager" />
        </template>
      </q-select>

      <!-- Acciones -->
      <div class="row justify-end q-gutter-sm q-mt-sm">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn color="accent" text-color="secondary" label="Guardar" type="submit" :loading="saving" />
      </div>
    </q-form>

    <!-- Dialog: crear manager al vuelo -->
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
const ManagerFormDialog = defineAsyncComponent(() => import('@/pages/tournaments/TournamentDetail/dialogs/ManagerFormDialog.vue'))


/** Opciones normalizadas para el tipo de campeonato */
const championshipOptions = [
  { label: 'Todos contra todos', value: 'league' },
  { label: 'Todos contra todos + eliminatoria', value: 'league_playoff' },
  { label: 'Eliminatoria', value: 'playoff' }
] as const

const saving = ref(false)
const showOrgDialog = ref(false)
const managerOptions = ref<{ label: string, value: string }[]>([])
const reglamentoFile = ref<File | null>(null)
const uploading = ref(false)

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
  managerId: ''
})


onMounted(async () => {
  const snaps = await getDocs(colManagers)
  managerOptions.value = snaps.docs.map(d => ({ label: d.data().displayName, value: d.id }))
})

function openNewManager() { showOrgDialog.value = true }

function onManagerCreated(opt: { id: string; label: string; value: string }) {
  managerOptions.value.push({ label: opt.label, value: opt.value })
  form.managerId = opt.value
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
