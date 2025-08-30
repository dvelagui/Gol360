<template>
  <div class="row items-center no-wrap q-px-sm q-py-xs">
    <div class="col-5 row items-center justify-end q-pr-sm">
      <div class="row text-subtitle1 ellipsis">
        <div>
          {{ homeName.toUpperCase() }}
        </div>
        <div class="q-px-sm" >
          <q-avatar v-if="homeCrest" size="25px" color="primary" text-color="white">
            <img :src="homeCrest" />
          </q-avatar>
          <q-avatar v-else size="25px" color="primary" text-color="white">
            <q-icon name="shield" />
          </q-avatar>
        </div>
      </div>
    </div>
    <div class="col-2 row items-center justify-center">
      <div class="score text-h6">
        {{ homeScoreDisplay }}

        <span class="dash">—</span>

        {{ awayScoreDisplay }}
      </div>
    </div>
    <div class="col-5 row items-center q-pl-sm">
      <div class="row text-subtitle1 ellipsis">
        <div class="q-px-sm" >
          <q-avatar v-if="awayCrest" size="25px" color="primary" text-color="white">
            <img :src="awayCrest" />
          </q-avatar>
          <q-avatar v-else size="25px" color="primary" text-color="white">
            <q-icon name="shield" />
          </q-avatar>
        </div>
        <div>
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
.score {
  font-weight: 900;
  letter-spacing: .5px;
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
