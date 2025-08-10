<template>
  <q-form @submit.prevent="submit" class="q-gutter-md">
    <q-input v-model="form.displayName" label="Nombre del torneo" :rules="[req]" />
    <q-input v-model="form.city" label="Ciudad" :rules="[req]" />
    <q-input v-model="form.type" label="Tipo de campeonato" :rules="[req]" />
    <q-input v-model="form.season" label="Temporada/Año (opcional)" />
    <q-input v-model="form.category" label="Categoría (Sub-20, Libre)" />
    <q-input v-model="form.rulesUrl" label="Reglamento (URL)" />
    <q-input v-model="form.description" label="Descripción breve" type="textarea" />
    <q-input v-model="form.numTeams" type="number" label="Número de equipos" :rules="[positiveInt]" />
    <q-input v-model="form.startDate" label="Fecha de inicio" type="date" :rules="[req]" />

    <q-select
      v-model="form.managerId"
      :options="managerOptions"
      label="Manager"
      emit-value map-options
      :rules="[req]"
    >
      <template #after>
        <q-btn dense color="primary" label="Nuevo Manager" @click="openNewManager" />
      </template>
    </q-select>

    <div class="row justify-end q-gutter-sm">
      <q-btn flat label="Cancelar" v-close-popup />
      <q-btn color="primary" label="Guardar" type="submit" :loading="saving" />
    </div>

    <!-- Dialog simple para crear organizer -->
    <q-dialog v-model="showOrgDialog">
      <q-card class="q-pa-md q-gutter-sm" style="min-width:340px">
        <div class="text-subtitle1">Nuevo Organizador</div>
        <q-input v-model="org.name" label="Nombre" :rules="[req]" />
        <q-input v-model="org.cedula" label="Cédula" :rules="[req]" />
        <div class="row justify-end q-gutter-sm q-mt-sm">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn color="primary" label="Crear" @click="createManager" />
        </div>
      </q-card>
    </q-dialog>
  </q-form>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { req, positiveInt } from '@/utils/formValidators'
import { addDoc, getDocs } from 'firebase/firestore'
import { colManagers } from '@/services/firestore/collections'
import type { Tournament } from '@/types/auth'

const saving = ref(false)
const showOrgDialog = ref(false)
const managerOptions = ref<{label:string,value:string}[]>([])
const form = reactive<Partial<Tournament>>({
  displayName:'', city:'', type:'', startDate:'', numTeams:0, managerId:''
})

const org = reactive({ name:'', cedula:'' })

onMounted(async () => {
  const snaps = await getDocs(colManagers)
  managerOptions.value = snaps.docs.map(d => ({ label: d.data().name, value: d.id }))
})

function openNewManager() { showOrgDialog.value = true }

async function createManager() {
  if (!org.name || !org.cedula) return
  const ref = await addDoc(colManagers, { ...org })
  managerOptions.value.push({ label: org.name, value: ref.id })
  form.managerId = ref.id
  showOrgDialog.value = false
}

const emit = defineEmits<{ (e:'submit', payload: Partial<Tournament>): void }>()

function submit() {
  saving.value = true
  emit('submit', form)
  saving.value = false
}
</script>
