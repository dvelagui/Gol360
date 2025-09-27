<template>
  <q-card class="tour-card cursor-pointer column justify-between" flat bordered>
    <div class="q-pa-md column items-center">
      <q-avatar size="60px" class="q-mb-sm" color="primary" text-color="white">
        <img v-if="avatar" :src="avatar" alt="avatar" />
        <q-icon v-else name="shield" size="md" />
      </q-avatar>

      <div class="text-subtitle1 text-center q-mb-xs">{{ t.displayName }}</div>

      <div class="row items-center q-gutter-sm q-mb-sm">
        <q-badge :color="statusColor" text-color="white" align="middle" class="q-px-sm">
          {{ statusLabel }}
        </q-badge>
      </div>

      <div class="text-body2 text-center text-grey-8">
        <div v-if="t.startDate">Inicio: {{ formattedDate }}</div>
        <div v-if="t.numTeams">{{ t.numTeams }} equipos</div>
      </div>
    </div>

    <q-separator />

    <div class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <q-icon name="location_on" size="18px" class="text-primary" />
        <div class="text-body2">{{ t.city || '—' }}</div>
      </div>
      <div class="row items-center q-gutter-sm q-mt-xs">
        <q-icon name="badge" size="18px" class="text-primary" />
        <div class="text-body2"><strong>Organizador:</strong> <br> <span class="text-body2">{{ t.managerName || '—' }}</span></div>
      </div>

      <q-btn
        class="q-mt-md full-width"
        color="accent"
        text-color="primary"
        label="Ver torneo"
        unelevated
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Status = 'scheduled' | 'in_progress' | 'finished'
type TType = '' | 'league' | 'league_playoff' | 'playoff'

interface TournamentCardData {
  tournamentId: string
  displayName: string
  city?: string
  startDate?: string   // ISO (yyyy-mm-dd)
  numTeams?: number
  managerId?: string
  managerName?: string // si lo tienes
  type?: TType
  status?: Status
  photoURL?: string | null
}

const props = defineProps<{ t: TournamentCardData }>()

const avatar = computed(() => props.t.photoURL || '')


const formattedDate = computed(() => {
  if (!props.t.startDate) return ''
  // deja el formato simple; puedes adaptarlo a Intl.DateTimeFormat si prefieres
  try {
    const d = new Date(props.t.startDate)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  } catch { return props.t.startDate }
})

const statusLabel = computed(() => {
  switch (props.t.status) {
    case 'in_progress': return 'En curso'
    case 'finished':    return 'Finalizado'
    default:            return 'Programado'
  }
})
const statusColor = computed(() => {
  switch (props.t.status) {
    case 'in_progress': return 'orange-7'
    case 'finished':    return 'green-7'
    default:            return 'grey-6'
  }
})
</script>

<style scoped lang="scss">
.tour-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
  transition: transform .12s ease, box-shadow .12s ease;
}
.tour-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.10);
}
</style>
