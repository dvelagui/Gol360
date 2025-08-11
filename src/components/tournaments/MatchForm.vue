
<template>
  <q-form @submit.prevent="onSave" class="q-gutter-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-select v-model="form.homeTeamId" :options="teams" option-value="id" option-label="name" label="Local" dense filled />
      </div>
      <div class="col-12 col-sm-6">
        <q-select v-model="form.awayTeamId" :options="teams" option-value="id" option-label="name" label="Visitante" dense filled />
      </div>

      <div class="col-6">
        <q-input v-model="form.dateISO" type="datetime-local" label="Fecha y hora" dense filled />
      </div>
      <div class="col-6">
        <q-input v-model="form.field" label="Cancha" dense filled />
      </div>

      <div class="col-6">
        <q-select v-model="form.phase" :options="['regular','playoff','semifinal','final']" label="Fase" dense filled />
      </div>
      <div class="col-6">
        <q-input v-model="form.round" label="Jornada/Fecha" dense filled />
      </div>

      <div class="col-12">
        <q-input v-model="form.referee" label="Árbitro (opcional)" dense filled />
      </div>
      <div class="col-12">
        <q-input v-model="form.notes" label="Notas (opcional)" type="textarea" autogrow dense filled />
      </div>
    </div>

    <div class="row justify-end q-gutter-sm q-mt-md">
      <q-btn flat label="Cancelar" color="grey-7" @click="$emit('cancel')" />
      <q-btn :disable="!canSave" label="Guardar" color="primary" type="submit" />
    </div>
  </q-form>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MatchPhase } from '@/types/competition'

const props = defineProps<{
  modelValue?: any
  tournamentId: string
  teams: { id: string; name: string }[]
  editId?: string
}>()
const emit = defineEmits<{
  (e: 'save', payload: any): void
  (e: 'cancel'): void
}>()

const form = ref({
  tournamentId: props.tournamentId,
  round: '',
  phase: 'regular' as MatchPhase,
  dateISO: '',
  field: '',
  referee: '',
  homeTeamId: '',
  awayTeamId: '',
  notes: ''
})

// si es edición, precargar (opcional)
if (props.modelValue) Object.assign(form.value, props.modelValue)

const canSave = computed(() =>
  form.value.homeTeamId && form.value.awayTeamId &&
  form.value.dateISO && form.value.field && form.value.homeTeamId !== form.value.awayTeamId
)

function onSave () { if (canSave.value) emit('save', { ...form.value }) }
</script>

