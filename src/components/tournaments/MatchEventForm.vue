<template>
  <q-form @submit.prevent="submit" class="q-gutter-sm">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-4">
        <q-select v-model="form.teamId" :options="teams" option-value="id" option-label="name" label="Equipo" dense filled />
      </div>
      <div class="col-12 col-sm-4">
        <q-select v-model="form.playerId" :options="players" option-value="id" option-label="name" label="Jugador (opcional)" dense filled clearable />
      </div>
      <div class="col-12 col-sm-4">
        <q-select v-model="form.type" :options="typeOptions" label="Tipo" dense filled />
      </div>

      <div class="col-6">
        <q-input v-model.number="form.minute" type="number" label="Minuto" dense filled />
      </div>
      <div class="col-6">
        <q-input v-model.number="form.extraTime" type="number" label="Tiempo extra (opcional)" dense filled />
      </div>

      <div class="col-12">
        <q-input v-model="form.metaDescription" type="textarea" label="Descripción" dense filled autogrow />
      </div>

      <div class="col-12" v-if="canSetApproved">
        <q-toggle v-model="form.status" true-value="approved" false-value="proposed" label="Aprobar al guardar" />
      </div>
    </div>

    <div class="row justify-end q-gutter-sm">
      <q-btn color="primary" label="Agregar evento" type="submit" />
    </div>
  </q-form>
</template>
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EventType } from '@/types/competition'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  matchId: string
  tournamentId: string
  teams: { id: string; name: string }[]
  playersByTeam?: (teamId: string) => { id: string; name: string }[] // opcional
  canApprove?: boolean  // admin/manager
  defaultTeamId?: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
}>()

const typeOptions: EventType[] = [
  'goal', 'assist', 'own_goal', 'yellow', 'red', 'penalty_scored', 'penalty_missed', 'sub_in', 'sub_out'
]

const form = ref({
  teamId: props.defaultTeamId || '',
  playerId: '',
  type: 'goal' as EventType,
  minute: 0,
  extraTime: null as number | null,
  metaDescription: '',
  status: 'proposed' as 'proposed'|'approved'
})

const userStore = useUserStore()
const canSetApproved = computed(() => !!props.canApprove)
const players = computed(() => props.playersByTeam ? props.playersByTeam(form.value.teamId) : [])

function submit () {
  const payload = {
    matchId: props.matchId,
    tournamentId: props.tournamentId,
    teamId: form.value.teamId,
    playerId: form.value.playerId || null,
    type: form.value.type,
    minute: Number(form.value.minute || 0),
    extraTime: form.value.extraTime ? Number(form.value.extraTime) : null,
    meta: form.value.metaDescription ? { description: form.value.metaDescription } : undefined,
    status: canSetApproved.value ? form.value.status : 'proposed',
    createdBy: userStore.user?.uid || ''
  }
  emit('submit', payload)
  // reset rápido
  form.value.minute = 0
  form.value.extraTime = null
  form.value.metaDescription = ''
}
</script>


