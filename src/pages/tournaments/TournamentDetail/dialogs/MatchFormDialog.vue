<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 720px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">{{ isEdit ? 'Editar partido' : 'Nuevo partido' }}</div>
        <q-space /><q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <MatchForm
          :tournament-id="tournamentId"
          :teams="teams"
          :model-value="formModel"
          @save="onSave"
          @cancel="() => (model = false)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MatchForm from '@/components/tournaments/MatchForm.vue'
import { useMatchStore } from '@/stores/matches'
import type { Match, MatchPhase } from '@/types/competition'
//import type { QSelectOption } from 'quasar' // opcional si lo usas en el form

// Props & v-model
const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  teams: { id: string; name: string }[]
  modelValue2?: {
    tournamentId: string
    round: string
    phase: MatchPhase
    dateISO: string
    field?: string
    referee?: string
    homeTeamId: string
    awayTeamId: string
    notes?: string
    id?: string // si existe, es edición
  } | null
}>()
const emit = defineEmits<{
  (e:'update:modelValue', v:boolean): void
  (e:'saved'): void
}>()

const store = useMatchStore()
const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const formModel = computed(() => props.modelValue2 ?? null)
const isEdit = computed(() => !!formModel.value?.id)

// Save handler: replica tu lógica original pero encapsulada aquí
async function onSave(modelForm: {
  tournamentId: string; round: string; phase: MatchPhase; dateISO: string;
  field?: string; referee?: string; homeTeamId: string; awayTeamId: string; notes?: string
}) {
  try {
    if (isEdit.value && formModel.value?.id) {
      const patch: Partial<Match> = {
        round: modelForm.round,
        phase: modelForm.phase,
        date: new Date(modelForm.dateISO).getTime(),
        homeTeamId: modelForm.homeTeamId,
        awayTeamId: modelForm.awayTeamId,
        ...(modelForm.field ?   { field: modelForm.field }     : {}),
        ...(modelForm.referee ? { referee: modelForm.referee } : {}),
        ...(modelForm.notes ?   { notes: modelForm.notes }     : {})
      }
      await store.update(formModel.value.id, patch)
    } else {
      await store.create({
        tournamentId: props.tournamentId,
        round: modelForm.round,
        phase: modelForm.phase,
        dateISO: modelForm.dateISO,
        field: modelForm.field,
        referee: modelForm.referee,
        homeTeamId: modelForm.homeTeamId,
        awayTeamId: modelForm.awayTeamId,
        notes: modelForm.notes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    }
    emit('saved')
  } catch (e) {
    console.log(e);

    // El padre muestra feedback tras saved→refetch; aquí solo cerramos
  } finally {
    model.value = false
  }
}
</script>
