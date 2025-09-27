<template>
  <div class="q-gutter-md">
    <div class="row items-center justify-between">
      <div class="text-subtitle1">Resultado</div>
      <q-badge v-if="props.match.status === 'terminado'" color="positive" label="Finalizado" />
    </div>

    <div class="row items-center q-col-gutter-md">
      <div class="col-12 col-sm-5">
        <q-input v-model.number="home" type="number" :label="homeName" dense filled :disable="!canEdit" />
      </div>
      <div class="col-12 col-sm-2 text-center text-h6 q-pt-sm">—</div>
      <div class="col-12 col-sm-5">
        <q-input v-model.number="away" type="number" :label="awayName" dense filled :disable="!canEdit" />
      </div>
    </div>

    <div class="text-caption text-grey-7">
      Goles por eventos aprobados: {{ approvedScore.home }} - {{ approvedScore.away }}
    </div>

    <div class="row justify-end q-gutter-sm q-mt-sm">
      <q-btn flat color="primary" icon="add" label="Agregar evento" @click="$emit('addEvent')" />
      <q-btn
        v-if="canEdit"
        color="primary" icon="check_circle" label="Confirmar final"
        @click="confirmFinal"
      />
    </div>

    <q-separator class="q-my-md" />

    <div class="text-subtitle2 q-mb-sm">Eventos</div>

    <div v-if="eStore.loading">
      <q-skeleton type="text" width="50%" />
      <q-skeleton type="text" />
      <q-skeleton type="text" width="70%" />
    </div>

    <q-timeline v-else color="primary">
      <q-timeline-entry
        v-for="ev in eStore.items"
        :key="ev.id"
        :title="teamName(ev.teamId.id)"
        :subtitle="`Min ${ev.minute}${ev.extraTime ? '+'+ev.extraTime : ''}`"
        :icon="ev.type === 'gol' || ev.type==='penalti_marcado' || ev.type==='autogol' ? 'sports_soccer' :
               ev.type === 'amarilla' ? 'square' :
               ev.type === 'roja' ? 'stop' : 'info'"
        :color="ev.status === 'aprobado' ? 'positive' : ev.status === 'rechazado' ? 'negative' : 'warning'"
      >
        <div class="text-body2">
          <b>{{ ev.type }}</b>
          <span v-if="ev.playerId"> — {{ ev.playerId.name }}</span>
        </div>
        <div class="text-caption text-grey-7" v-if="ev.meta?.description">{{ ev.meta.description }}</div>

        <div class="row q-gutter-xs q-mt-xs" v-if="canEdit">
          <q-btn dense flat icon="task_alt" color="positive" @click="$emit('approve', ev.id)" v-if="ev.status!=='aprobado'" />
          <q-btn dense flat icon="block" color="warning" @click="$emit('reject', ev.id)" v-if="ev.status!=='rechazado'" />
          <q-btn dense flat icon="delete" color="negative" @click="$emit('remove', ev.id)" />
        </div>
      </q-timeline-entry>
    </q-timeline>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Match } from '@/types/competition'
import { useEventStore } from '@/stores/events'
import { computeScoreFromEvents } from '@/services/eventService'

const props = defineProps<{
  match: Match
  teams: { id: string; name: string }[]
  canEdit: boolean      // admin/manager
  canPropose: boolean   // captain
  teamHome: { id: string; name: string }
  teamAway: { id: string; name: string }
}>()

const emit = defineEmits<{
  (e: 'confirm', score: {home:number;away:number}): void
  (e: 'addEvent'): void
  (e: 'approve', id: string): void
  (e: 'reject', id: string): void
  (e: 'remove', id: string): void
}>()

const eStore = useEventStore()
const homeName = computed(() => props.teamHome.name)
const awayName = computed(() => props.teamAway.name)

const home = ref(props.match.score.home)
const away = ref(props.match.score.away)

onMounted(() => eStore.fetch(props.match.id))

const approvedScore = computed(() => computeScoreFromEvents(eStore.items, props.teamHome.id, props.teamAway.id))

function confirmFinal () {
  if (!props.canEdit) return
  emit('confirm', { home: Number(home.value), away: Number(away.value) })
}

function teamName(id: string) {
  return props.teams.find(t => t.id === id)?.name || '—'
}
</script>


