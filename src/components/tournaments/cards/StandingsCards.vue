<template>
  <div class="grid q-col-gutter-md">
    <q-card
      v-for="r in rows"
      :key="r.teamId"
      flat
      bordered
      class="q-pa-sm"
    >
      <div class="row items-center q-gutter-sm">
        <q-avatar size="36px" v-if="r.crestUrl"><img :src="r.crestUrl" /></q-avatar>
        <div>
          <div class="text-subtitle2">{{ r.pos }}. {{ r.teamName }}</div>
          <div class="text-caption text-grey-7">PJ {{ r.played }} • DG {{ r.goalDiff }}</div>
        </div>
        <q-space />
        <div class="text-h6">{{ r.points }}</div>
      </div>

      <q-separator class="q-my-sm" />

      <div class="row justify-around text-caption">
        <div><span class="text-weight-medium">PG</span> {{ r.won }}</div>
        <div><span class="text-weight-medium">PE</span> {{ r.draw }}</div>
        <div><span class="text-weight-medium">PP</span> {{ r.lost }}</div>
        <div><span class="text-weight-medium">GF</span> {{ r.goalsFor }}</div>
        <div><span class="text-weight-medium">GC</span> {{ r.goalsAgainst }}</div>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { StandingRow } from '@/utils/standings'
type Row = StandingRow & { teamName: string; crestUrl: string | null; pos: number }
defineProps<{ rows: Row[] }>()
</script>

<style scoped>
.grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
