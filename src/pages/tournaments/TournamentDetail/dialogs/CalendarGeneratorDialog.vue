<!-- src/pages/tournaments/TournamentDetail/dialogs/CalendarGeneratorDialog.vue -->
<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 520px; max-width: 92vw">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">
          {{ mode === 'phase1' ? 'Generar calendario — Fase 1' : 'Generar calendario — Eliminatoria' }}
        </div>
        <q-space />
        <q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- MODO FASE 1 -->
        <div v-if="mode === 'phase1'">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-toggle v-model="formPhase1.allPlayAll" label="Todos contra todos (un solo grupo)" />
            </div>
            <div class="col-12" v-if="!formPhase1.allPlayAll">
              <q-input
                v-model.number="formPhase1.groups"
                type="number"
                label="Número de grupos"
                :min="1"
                :max="maxGroups"
                dense
                filled
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                Máximo sugerido: {{ maxGroups }} (≥ 2 equipos por grupo)
              </div>
            </div>
            <div class="col-12">
              <q-option-group
                v-model="formPhase1.mode"
                type="radio"
                :options="[
                  { label: 'Solo ida', value: 'single' },
                  { label: 'Ida y vuelta', value: 'double' }
                ]"
                dense
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="formPhase1.startISO"
                type="datetime-local"
                label="Fecha y hora de inicio (opcional)"
                hint="Si lo dejas vacío: mañana 09:00"
                dense
                filled
              />
            </div>
          </div>
        </div>

        <!-- MODO ELIMINATORIA -->
        <div v-else>
          <div class="q-mb-md text-body2">
            Configura la fase eliminatoria en base a la tabla de posiciones actual.
          </div>

          <div class="q-mb-sm">
            <q-badge color="primary" v-if="hasGroups">Por grupos detectados</q-badge>
            <q-badge color="teal" v-else>Un solo grupo</q-badge>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12" v-if="hasGroups">
              <q-input
                v-model.number="formKO.passPerGroup"
                type="number"
                label="¿Cuántos pasan por grupo?"
                :min="1"
                :max="maxPassPerGroup"
                dense
                filled
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                Máximo {{ maxPassPerGroup }} según cantidad de equipos/grupo.
              </div>
            </div>

            <div class="col-12" v-else>
              <q-input
                v-model.number="formKO.totalPass"
                type="number"
                label="¿Cuántos equipos pasan a KO?"
                :min="2"
                :max="teams.length"
                dense
                filled
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                Use un número par (4, 8, 16...). Se emparejarán como {{ koSeedingLabel }}.
              </div>
            </div>

            <div class="col-12">
              <q-option-group
                v-model="formKO.seeding"
                type="radio"
                :options="[
                  { label: '1º vs último, 2º vs penúltimo (sembrado)', value: 'seeded' },
                  { label: 'Cruces aleatorios', value: 'random' }
                ]"
                dense
              />
            </div>

            <div class="col-12">
              <q-option-group
                v-model="formKO.mode"
                type="radio"
                :options="[
                  { label: 'Partido único', value: 'single' },
                  { label: 'Ida y vuelta', value: 'double' }
                ]"
                dense
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="formKO.startISO"
                type="datetime-local"
                label="Fecha y hora de inicio (opcional)"
                hint="Si lo dejas vacío: mañana 09:00"
                dense
                filled
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          color="primary"
          :label="mode === 'phase1' ? 'Generar Fase 1' : 'Generar Eliminatoria'"
          :loading="loading"
          @click="onGenerate"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { useUserStore } from '@/stores/user'
import { listMatchesByTournament, createMatch } from '@/services/matchService'
import type { Match } from '@/types/competition'
import type { Team } from '@/types/auth'

import {
  computeStandings,
  computeStandingsByGroup,
  topNFromTable,
  topNEachGroup,
  buildPairsFromList,
  buildCrossPairsFromGroups,
  knockoutRoundLabel,
} from '@/utils/standings'

/* Props */
const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  teams: Team[]               // { id, displayName, ... }
  existingMatches: boolean    // true => ya hubo Fase 1; generaremos KO
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'generated'): void
}>()

/* v-model */
const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

/* Modo */
const mode = computed<'phase1' | 'ko'>(() => (props.existingMatches ? 'ko' : 'phase1'))

/* ===========================================
   FORMULARIO FASE 1
=========================================== */
const formPhase1 = ref({
  allPlayAll: true,
  groups: 2,
  mode: 'single' as 'single' | 'double',
  startISO: ''
})

const maxGroups = computed(() => {
  const n = props.teams.length
  return Math.max(1, Math.floor(n / 2)) // ≥2 por grupo
})

/* ===========================================
   FORMULARIO KO
=========================================== */
const formKO = ref({
  totalPass: 8,          // un solo grupo
  passPerGroup: 2,       // por grupos
  seeding: 'seeded' as 'seeded' | 'random',
  mode: 'single' as 'single' | 'double',
  startISO: ''
})

const koSeedingLabel = computed(() =>
  formKO.value.seeding === 'seeded' ? '1º vs último (sembrado)' : 'aleatorio'
)

/* ===========================================
   TABLAS Y DETECCIÓN DE GRUPOS
=========================================== */
const matches = ref<Match[]>([])
const hasGroups = ref(false)
const groupedTable = ref<Record<string, ReturnType<typeof computeStandings>[number][]>>({})
const generalTable = ref<ReturnType<typeof computeStandings>>([])
const maxPassPerGroup = computed(() => {
  // máximo = menor cantidad de equipos entre grupos (para simetría)
  const sizes = Object.values(groupedTable.value).map(r => r.length)
  return sizes.length ? Math.min(...sizes) : props.teams.length
})

async function loadMatches() {
  matches.value = await listMatchesByTournament(props.tournamentId)
  // Calcular tablas
  const teamsLite = props.teams.map(t => ({ id: t.id, name: t.displayName }))
  groupedTable.value = computeStandingsByGroup(teamsLite, matches.value)
  generalTable.value = computeStandings(teamsLite, matches.value)
  hasGroups.value = Object.keys(groupedTable.value).length > 1
}

onMounted(async () => {
  await loadMatches()
  // defaults UI más amigables
  formPhase1.value.allPlayAll = props.teams.length <= 8
  formPhase1.value.groups = Math.min(maxGroups.value, 2)
})

watch(() => props.modelValue, async (open) => {
  if (open) await loadMatches()
})

/* ===========================================
   HELPERS COMUNES
=========================================== */
function startDateISO(userISO?: string): string {
  if (userISO) return userISO
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function toLocalISO(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function buildRoundRobin(ids: string[]): Array<Array<[string, string]>> {
  const teams = ids.slice()
  if (teams.length % 2 === 1) teams.push('__BYE__')
  const n = teams.length
  const rounds: Array<Array<[string, string]>> = []

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i]!
      const away = teams[n - 1 - i]!
      if (home !== '__BYE__' && away !== '__BYE__') pairs.push([home, away])
    }
    rounds.push(pairs)

    const rest = teams.slice(1)
    const popped = rest.pop()
    if (popped !== undefined) rest.unshift(popped)
    teams.splice(0, teams.length, ...[teams[0]!, ...rest])
  }
  return rounds
}

function splitIntoGroups<T>(items: T[], k: number): T[][] {
  // reparto balanceado, sin random fuerte (evitamos cambio brusco en UI)
  const out: T[][] = Array.from({ length: k }, () => [])
  const copy = items.slice()
  for (let i = 0; i < copy.length; i++) out[i % k]!.push(copy[i]!)
  return out
}

/* ===========================================
   GENERAR
=========================================== */
const loading = ref(false)

async function onGenerate() {
  try {
    loading.value = true
    const uid = useUserStore().user?.uid ?? ''
    const teamsLite = props.teams.map(t => ({ id: t.id, name: t.displayName }))

    // ======== FASE 1 ========
    if (mode.value === 'phase1') {
      if (teamsLite.length < 2) {
        Notify.create({ type: 'warning', message: 'Se requieren al menos 2 equipos.' })
        return
      }

      const groups = formPhase1.value.allPlayAll
        ? [teamsLite]
        : splitIntoGroups(teamsLite, Math.max(1, Math.min(formPhase1.value.groups, maxGroups.value)))

      const baseISO = startDateISO(formPhase1.value.startISO)
      let current = new Date(baseISO)
      let created = 0

      for (let gi = 0; gi < groups.length; gi++) {
        const group = groups[gi]!
        const ids = group.map(g => g.id)
        const rr = buildRoundRobin(ids)
        const rounds = formPhase1.value.mode === 'double'
          ? [...rr, ...rr.map(pairs => pairs.map(([a, b]) => [b, a] as [string, string]))]
          : rr

        const groupLabel = groups.length === 1 ? undefined : String.fromCharCode(65 + gi) // A,B,...

        let fechaIdx = 1
        for (const pairs of rounds) {
          for (const [homeId, awayId] of pairs) {
            const home = group.find(g => g.id === homeId)!
            const away = group.find(g => g.id === awayId)!
            const payload = {
              tournamentId: props.tournamentId,
              round: `Fecha ${fechaIdx}`,
              phase: 'fase 1' as Match['phase'],
              dateISO: toLocalISO(current),
              date: current.getTime(),
              field: '',
              referee: '',
              homeTeamId: { id: home.id, name: home.name },
              awayTeamId: { id: away.id, name: away.name },
              notes: '',
              ...(groupLabel ? { group: groupLabel } : {})
            }

            await createMatch(
              {
                ...payload,
                createdAt: undefined,
                createdBy: undefined,
                status: undefined,
                score: undefined,
                confirmedBy: undefined
              } as Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'status' | 'score' | 'confirmedBy'> & { dateISO: string },
              { uid }
            )
            created++
            current = new Date(current.getTime() + 2 * 60 * 60 * 1000) // +2h
          }
          // siguiente fecha día siguiente 09:00
          current.setDate(current.getDate() + 1)
          current.setHours(9, 0, 0, 0)
          fechaIdx++
        }
      }

      Notify.create({ type: 'positive', message: `Calendario Fase 1 generado: ${created} partidos` })
      emit('generated')
      model.value = false
      return
    }

    // ======== ELIMINATORIA ========
    // Recalcular por si el usuario dejó abierto el modal y hubo cambios
    await loadMatches()

    // Semillas
    let pairs: Array<[ReturnType<typeof computeStandings>[number], ReturnType<typeof computeStandings>[number]]> = []

    if (hasGroups.value) {
      const topEach = topNEachGroup(groupedTable.value, Math.max(1, formKO.value.passPerGroup))
      pairs = buildCrossPairsFromGroups(topEach, formKO.value.seeding)
    } else {
      const n = Math.max(2, formKO.value.totalPass)
      const seeds = topNFromTable(generalTable.value, n)
      pairs = buildPairsFromList(seeds, formKO.value.seeding)
    }

    if (pairs.length === 0) {
      Notify.create({ type: 'warning', message: 'No hay suficientes clasificados para generar KO.' })
      return
    }

    const baseISO = startDateISO(formKO.value.startISO)
    let current = new Date(baseISO)
    const numPairs = pairs.length
    const roundLabel = knockoutRoundLabel(numPairs)

    let created = 0
    for (const [homeRow, awayRow] of pairs) {
      const payloadBase = {
        tournamentId: props.tournamentId,
        round: roundLabel,
        phase: 'eliminatoria' as Match['phase'],
        field: '',
        referee: '',
        notes: ''
      }

      const h = { id: homeRow.teamId, name: homeRow.teamName }
      const a = { id: awayRow.teamId, name: awayRow.teamName }

      // Partido de ida (o único)
      const first = {
        ...payloadBase,
        dateISO: toLocalISO(current),
        date: current.getTime(),
        homeTeamId: h,
        awayTeamId: a
      }

      await createMatch(
        {
          ...first,
          createdAt: undefined,
          createdBy: undefined,
          status: undefined,
          score: undefined,
          confirmedBy: undefined
        } as Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'status' | 'score' | 'confirmedBy'> & { dateISO: string },
        { uid }
      )
      created++
      current = new Date(current.getTime() + 2 * 60 * 60 * 1000) // +2h

      // Vuelta (si corresponde)
      if (formKO.value.mode === 'double') {
        const second = {
          ...payloadBase,
          dateISO: toLocalISO(current),
          date: current.getTime(),
          homeTeamId: a,
          awayTeamId: h
        }

        await createMatch(
          {
            ...second,
            createdAt: undefined,
            createdBy: undefined,
            status: undefined,
            score: undefined,
            confirmedBy: undefined
          } as Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'status' | 'score' | 'confirmedBy'> & { dateISO: string },
          { uid }
        )
        created++
        current = new Date(current.getTime() + 2 * 60 * 60 * 1000) // +2h
      }
    }

    Notify.create({ type: 'positive', message: `Eliminatoria generada: ${created} partidos (${roundLabel})` })
    emit('generated')
    model.value = false
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    Notify.create({ type: 'negative', message: `Error generando: ${msg}` })
  } finally {
    loading.value = false
  }
}
</script>
