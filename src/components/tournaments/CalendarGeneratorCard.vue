<template>
  <q-card class="q-pa-md shadow-2 rounded-borders">
    <div class="row items-center q-mb-sm">
      <q-icon name="event" class="q-mr-sm" />
      <div class="text-subtitle1">Generar calendario</div>
      <q-space />
      <q-badge :color="canGenerate ? 'positive' : 'grey-5'">
        {{ statusLabel }}
      </q-badge>
    </div>

    <div class="text-caption q-mb-md">
      Configura la primera fase del torneo y crea los partidos automáticamente.
    </div>

    <div class="q-gutter-sm">
      <q-option-group
        v-model="mode"
        :options="[
          {label: 'Todos contra todos (1 grupo)', value: 'single'},
          {label: 'Por grupos (usa el grupo de cada equipo)', value: 'groups'}
        ]"
        type="radio"
      />

      <q-option-group
        v-model="legs"
        :options="[
          {label: 'Solo ida', value: 1},
          {label: 'Ida y vuelta', value: 2}
        ]"
        type="radio"
      />

      <q-select
        v-if="mode==='single'"
        v-model="pairing"
        :options="pairingOptions"
        label="Estrategia de emparejamiento"
        dense filled
      />

      <div class="text-caption q-mt-xs">
        Los partidos se programarán desde mañana, cada 2 horas.
      </div>
    </div>

    <div class="row justify-end q-gutter-sm q-mt-md">
      <q-btn flat label="Cancelar" @click="$emit('close')" />
      <q-btn
        color="primary"
        :disable="!canGenerate || generating"
        :loading="generating"
        label="Generar"
        @click="onGenerate"
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Notify } from 'quasar'
import { bulkCreateMatches, areAllFinished, hasMatches } from '@/services/matchService'
import type { Team } from '@/types/auth'
import type { Match } from '@/types/competition'

const props = defineProps<{
  tournamentId: string
  teams: Team[]
  phaseHint?: string        // "fase 1" o "eliminatorias"
}>()
const emit = defineEmits<{ (e:'generated'): void; (e:'close'): void }>()

const mode = ref<'single'|'groups'>('single')
const legs = ref<1|2>(1)
const pairing = ref<'random'|'first_last'|'topN'>('random')
const pairingOptions = [
  { label: 'Aleatorio', value: 'random' },
  { label: 'Primeros vs últimos', value: 'first_last' },
  { label: 'Top N (2/4/6/8/16)', value: 'topN' }
]

const generating = ref(false)

/** Habilitación/estado */
const canGenerate = computed<boolean>(() => !!props.teams.length)
const statusLabel = computed(() => canGenerate.value ? 'Listo' : 'Incompleto')

/** Utiles de armado */
function roundRobinPairs(ids: string[], strategy: 'random'|'first_last'|'topN'): [string, string][][] {
  // produce array de jornadas -> lista de [local, visitante]
  const arr = ids.slice()
  if (strategy === 'random') {
    arr.sort(() => Math.random() - 0.5)
  } else if (strategy === 'first_last') {
    // deja el orden, pero el algoritmo RR igual mezcla
  } else if (strategy === 'topN') {
    // toma primeros N par (2/4/6/8/16); si no calza, cae a todos
    const allowed = [2,4,6,8,16]
    const N = allowed.find(n => n <= arr.length && n % 2 === 0) ?? arr.length
    arr.splice(N) // recorta
  }

  // algoritmo round-robin estándar (si impar, agrega "bye" fantasma)
  const teams = arr.slice()
  if (teams.length % 2 !== 0) teams.push('__BYE__')
  const n = teams.length
  const half = n / 2
  const jornadas: [string,string][][] = []

  const rotate = teams.slice()
  for (let r = 0; r < n - 1; r++) {
    const jornada: [string,string][] = []
    for (let i = 0; i < half; i++) {
      const home = rotate[i] ?? ''
      const away = rotate[n - 1 - i] ?? ''
      if (home !== '__BYE__' && away !== '__BYE__') {
        jornada.push([home, away])
      }
    }
    jornadas.push(jornada)
    const fixed = rotate[0] ?? ''
    const tail = rotate.splice(1).filter((x): x is string => typeof x === 'string')
    const last = tail.pop()
    if (last !== undefined) {
      tail.unshift(last)
    }
    rotate.splice(0, rotate.length, fixed, ...tail)
  }
  return jornadas
}

function scheduleFromTomorrow(count: number): number[] {
  const slots: number[] = []
  const base = new Date(); base.setDate(base.getDate() + 1)
  base.setHours(10, 0, 0, 0)   // 10:00 AM

  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() + i * 2 * 3600000) // +2h
    // cada 4 partidos, pasa al día siguiente 10:00
    if (i > 0 && i % 4 === 0) {
      const lastSlot = slots[slots.length - 1]
      if (typeof lastSlot !== 'undefined') {
        const day = new Date(lastSlot); day.setDate(day.getDate() + 1); day.setHours(10,0,0,0)
        slots.push(day.getTime())
      }
    }
    slots.push(d.getTime())
  }
  return slots
}

async function onGenerate() {
  try {
    generating.value = true

    // Regla de habilitación/rehabilitación:
    // - si no hay partidos -> permite
    // - si hay, solo permite si todos están finished
    const had = await hasMatches(props.tournamentId)
    if (had) {
      const allFin = await areAllFinished(props.tournamentId)
      if (!allFin) {
        Notify.create({ type:'warning', message:'Ya existe un calendario en curso. Solo podrás re-generarlo cuando todos los partidos estén terminados.' })
        generating.value = false
        return
      }
    }

    // Construcción de listas/grupos
    const teamViews = props.teams.map(t => ({ id: t.id, name: t.displayName, group: t.group ?? '' }))
    const groups: Record<string,string[]> = {}

    if (mode.value === 'groups') {
      for (const t of teamViews) {
        const g = t.group || 'A'
        if (!groups[g]) groups[g] = []
        groups[g].push(t.id)
      }
    } else {
      groups['A'] = teamViews.map(t => t.id)
    }

    const phase: Match['phase'] = had ? 'eliminatoria' as Match['phase'] : 'group_stage' as Match['phase']
    const created: Omit<Match,'id'|'createdAt'|'createdBy'|'status'|'score'|'confirmedBy'>[] = []

    // Genera calendario por grupo (round robin)
    for (const [group, ids] of Object.entries(groups)) {
      if (ids.length < 2) continue
      const jornadas = roundRobinPairs(ids, pairing.value)
      // ida y vuelta
      const totalJornadas = legs.value === 2 ? [...jornadas, ...jornadas] : jornadas

      let roundIdx = 1
      for (const jornada of totalJornadas) {
        for (const [homeId, awayId] of jornada) {
          const h = teamViews.find(t => t.id === homeId)!
          const a = teamViews.find(t => t.id === awayId)!
          created.push({
            tournamentId: props.tournamentId,
            round: `Fecha ${roundIdx}`,
            phase,
            group,
            date: 0, // se setea luego con los slots
            field: '',
            referee: '',
            homeTeamId: { id: h.id, name: h.name },
            awayTeamId: { id: a.id, name: a.name },
            notes: ''
          })
        }
        roundIdx++
      }
    }

    // Asignar fechas (desde mañana, +2h)
    const slots = scheduleFromTomorrow(created.length)
    created.forEach((m, i) => { m.date = slots[i] ?? Date.now() })

    await bulkCreateMatches(created, { uid: 'system' }) // usa uid real si quieres auditar
    Notify.create({ type:'positive', message:`Se generaron ${created.length} partidos (${mode.value === 'groups' ? 'por grupos' : 'todos contra todos'})` })
    emit('generated')
  } catch (e) {
    Notify.create({ type:'negative', message: String(e) })
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.rounded-borders { border-radius: 12px; }
</style>
