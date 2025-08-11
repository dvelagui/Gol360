<template>
  <q-card bordered class="q-pa-md">
    <div class="row items-center justify-between">
      <div class="text-caption text-grey-7">{{ dt }}</div>
      <q-badge :color="match.status === 'scheduled' ? 'info' : match.status === 'finished' ? 'positive' : 'warning'">
        {{ match.status }}
      </q-badge>
    </div>

    <div class="row items-center justify-between q-mt-sm">
      <div class="text-subtitle1">{{ home }}</div>
      <div class="text-h6">
        {{ match.score.home }} - {{ match.score.away }}
      </div>
      <div class="text-subtitle1">{{ away }}</div>
    </div>

    <div class="row items-center q-mt-xs">
      <q-icon name="place" size="16px" class="q-mr-xs" />
      <div class="text-caption">{{ match.field }}</div>
    </div>

    <slot name="actions" />
  </q-card>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { Match } from '@/types/competition'

const props = defineProps<{
  match: Match
  teamById: (id: string) => { id: string; name: string } | undefined
}>()

const home = computed(() => props.teamById(props.match.homeTeamId)?.name || '—')
const away = computed(() => props.teamById(props.match.awayTeamId)?.name || '—')
const dt   = computed(() => new Date(props.match.date).toLocaleString())
</script>


