<template>
  <q-dialog v-model="model" persistent maximized>
    <q-card flat bordered class="results-dialog-card">
      <!-- Header estilo moderno -->
      <q-card-section class="bg-gradient text-white q-py-md">
        <div class="row items-center">
          <div class="col">
            <div class="text-subtitle1 text-weight-bold">
              <q-icon name="sports_score" class="q-mr-sm" />
              Resultados y Eventos
            </div>
            <div v-if="match" class="text-caption q-mt-xs">
              {{ match.homeTeamId.name }} vs {{ match.awayTeamId.name }}
              <q-chip
                v-if="match.status === 'terminado'"
                color="white"
                text-color="positive"
                icon="check_circle"
                dense
                class="q-ml-sm"
              >
                Finalizado
              </q-chip>
              <q-chip
                v-else-if="match.status === 'en progreso'"
                color="white"
                text-color="warning"
                icon="schedule"
                dense
                class="q-ml-sm"
              >
                En Curso
              </q-chip>
            </div>
          </div>
          <q-btn dense round flat icon="close" v-close-popup class="text-white" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="match" class="dialog-content-scrollable">
        <ResultsForm
          :match="match"
          :teams="teams"
          :team-home="match.homeTeamId"
          :team-away="match.awayTeamId"
          :can-edit="canEdit"
          :can-propose="canPropose"
          @confirm="(s) => $emit('confirm', s)"
          @addEvent="$emit('addEvent')"
          @approve="(id) => $emit('approve', id)"
          @reject="(id) => $emit('reject', id)"
          @remove="(id) => $emit('remove', id)"
        />
      </q-card-section>

      <!-- Estado de carga si no hay match -->
      <q-card-section v-else class="text-center q-pa-xl">
        <q-spinner-dots size="xl" color="primary" />
        <div class="text-subtitle2 q-mt-md text-grey-6">Cargando datos del partido...</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResultsForm from '@/components/tournaments/forms/ResultForm.vue'
import type { Match } from '@/types/competition'

const props = defineProps<{
  modelValue: boolean
  match: Match | null
  teams: { id: string; name: string }[]
  canEdit: boolean
  canPropose: boolean
}>()
const emit = defineEmits<{
  (e:'update:modelValue', v:boolean): void
  (e:'confirm', score:{home:number;away:number}): void
  (e:'addEvent'): void
  (e:'approve', id:string): void
  (e:'reject', id:string): void
  (e:'remove', id:string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

</script>

<style scoped lang="scss">
.results-dialog-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

.bg-gradient {
  background: linear-gradient(135deg, var(--q-primary) 0%, #1976d2 100%);
  flex-shrink: 0;
}

.text-weight-bold {
  font-weight: 900 !important;
}

.dialog-content-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--q-primary);
    border-radius: 4px;

    &:hover {
      background: var(--q-secondary);
    }
  }
}

// Eliminar el scroll interno del form ya que ahora el dialog maneja el scroll
:deep(.analysis-section) {
  max-height: none !important;
  overflow-y: visible !important;
}

@media (max-width: 600px) {
  .dialog-content-scrollable {
    padding: 12px;
  }

  .bg-gradient {
    background: var(--q-primary);
  }
}
</style>
