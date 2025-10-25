<template>
  <q-dialog v-model="model">
    <q-card flat bordered class="rounded-2xl overflow-hidden" style="min-width: 720px; max-width: 95vw;">

      <q-card-section class="bg-primary text-white q-py-md">
        <div class="row items-center">
          <div class="col">
            <div class="text-subtitle1 text-weight-bold">
              {{ isEdit ? 'Editar Partido' : 'Nuevo Partido' }}
            </div>
            <div class="text-caption q-mt-xs">
              {{ isEdit ? 'Modifica los datos del encuentro' : 'Programa un nuevo encuentro' }}
            </div>
          </div>
          <q-btn dense round flat icon="close" v-close-popup class="text-white" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <MatchForm
          v-if="formModel"
          :tournament-id="tournamentId"
          :teams="teams"
          v-bind="existingRounds ? { existingRounds } : {}"
          :model-value="formModel"
          @save="onSave"
          @cancel="() => (model = false)"
        />
        <MatchForm
          v-else
          :tournament-id="tournamentId"
          :teams="teams"
          v-bind="existingRounds ? { existingRounds } : {}"
          @save="onSave"
          @cancel="() => (model = false)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MatchForm from '@/components/tournaments/forms/MatchForm.vue'
import { useMatchStore } from '@/stores/matches'
import type { Match, MatchPhase } from '@/types/competition'
//import type { QSelectOption } from 'quasar' // opcional si lo usas en el form

// Props & v-model
const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  teams: { id: string; name: string }[]
  existingRounds?: string[] // Rounds that already exist in the tournament
  modelValue2?: {
    tournamentId: string
    round: string
    phase: MatchPhase
    dateISO: string
    field?: string
    referee?: string
    homeTeamId: { id: string; name: string }
    awayTeamId: { id: string; name: string }
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
  tournamentId: string;
  round: string;
  phase: MatchPhase;
  dateISO: string;
  field?: string | undefined;
  referee?: string | undefined;
  homeTeamId: { id: string; name: string };
  awayTeamId: { id: string; name: string };
  notes?: string | undefined;
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
      console.log('Actualizando partido:', patch);

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
      console.log('Creando partido:', {
        tournamentId: props.tournamentId,
        round: modelForm.round,
        phase: modelForm.phase,
        dateISO: modelForm.dateISO,
        field: modelForm.field,
        referee: modelForm.referee,
        homeTeamId: modelForm.homeTeamId,
        awayTeamId: modelForm.awayTeamId,
        notes: modelForm.notes
      })

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

<style scoped lang="scss">
.rounded-2xl {
  border-radius: 16px;
}

.text-weight-bold {
  font-weight: 900 !important;
}

@media (max-width: 600px) {
  .q-card {
    min-width: 100vw !important;
    height: 100vh !important;
    border-radius: 0 !important;
  }
}
</style>
