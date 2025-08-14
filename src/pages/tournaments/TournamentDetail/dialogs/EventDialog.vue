<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 600px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">Nuevo evento</div>
        <q-space /><q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="match">
        <MatchEventForm
          :match-id="match.id"
          :tournament-id="tournamentId"
          :teams="teams"
          :can-approve="canApprove"
          @submit="(p) => $emit('submit', p)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MatchEventForm from '@/components/tournaments/MatchEventForm.vue'
import type { Match, MatchEvent } from '@/types/competition'

const props = defineProps<{
  modelValue: boolean
  match: Match | null
  tournamentId: string
  teams: { id:string; name:string }[]
  canApprove: boolean
}>()
defineEmits<{
  (e:'update:modelValue', v:boolean): void
  (e:'submit', payload: Omit<MatchEvent,'id'|'createdAt'|'status'> & { status?: 'proposed' | 'approved' }): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)

})
const emit = defineEmits()
</script>
