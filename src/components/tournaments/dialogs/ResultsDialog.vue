<template>
  <q-dialog v-model="model" persistent>
    <q-card style="min-width: 760px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">Resultados y eventos</div>
        <q-space /><q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="match">
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
