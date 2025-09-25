<template>
  <div class="row items-center justify-between no-wrap q-pa-xs text-body2">
    <div class="col-4 row items-center justify-center text-center ellipsis">
      <div class="d-flex d-column items-center">
        <div class="q-px-sm" >
          <q-avatar v-if="homeCrest" size="25px" color="accent" text-color="white">
            <img :src="homeCrest" />
          </q-avatar>
          <q-avatar v-else size="25px" text-color="accent">
            <q-icon name="shield" />
          </q-avatar>
        </div>
        <div class="q-mt-xs">
          {{ homeName.toUpperCase() }}
        </div>
      </div>
    </div>
    <div class="col-4 row items-center justify-center no-wrap score-match">
      <div class="score text-h6">
        {{ homeScoreDisplay }}
        <span class="dash text-body2">—</span>
        {{ awayScoreDisplay }}
      </div>
    </div>
    <div class="col-4 row items-center justify-center text-center ellipsis">
      <div class="d-flex d-column items-center">
        <div class="q-px-sm" >
          <q-avatar v-if="awayCrest" size="25px"  text-color="white">
            <img :src="awayCrest" />
          </q-avatar>
          <q-avatar v-else size="25px"  text-color="accent">
            <q-icon name="shield" />
          </q-avatar>
        </div>
        <div class="q-mt-xs">
          {{ awayName.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Match } from '@/types/competition'

const props = defineProps<{
  match: Match
  teamById: (id: string) => { id: string; name: string; crestUrl?: string } | undefined
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'results'): void
}>()

/* Resolución de nombres/escudos soportando los dos formatos:
   - match.homeTeamId: string
   - match.homeTeamId: { id, name }
*/
type TeamIdType = string | { id: string; name: string; crestUrl?: string };

const homeObj = computed(() => {
  const v = props.match.homeTeamId as TeamIdType
  if (v && typeof v === 'object') return v
  if (typeof v === 'string') return props.teamById(v) ?? { id: v, name: 'Equipo' }
  return { id: '', name: 'Equipo' }
})
const awayObj = computed(() => {
  const v = props.match.awayTeamId as TeamIdType
  if (v && typeof v === 'object') return v
  if (typeof v === 'string') return props.teamById(v) ?? { id: v, name: 'Equipo' }
  return { id: '', name: 'Equipo' }
})

const homeName = computed(() => homeObj.value?.name ?? 'Local')
const awayName = computed(() => awayObj.value?.name ?? 'Visitante')

const homeCrest = computed(() => homeObj.value?.crestUrl)
const awayCrest = computed(() => awayObj.value?.crestUrl)

const homeScoreDisplay = computed(() => props.match.score?.home ?? '')
const awayScoreDisplay = computed(() => props.match.score?.away ?? '')



</script>

<style scoped>
.score-match {
  background-color: rgba(190, 190, 190, 0.5);
  border-radius: 12px;
  padding: 15px 5px;
  margin: 0 auto;
}

.score {
  font-weight: 900;
}

.dash {
  opacity: .6;
  padding: 0 2px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
