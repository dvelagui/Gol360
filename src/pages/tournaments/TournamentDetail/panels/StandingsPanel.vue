<template>
  <div class="q-pa-none">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Tabla de posiciones</div>
      <q-space />
      <q-toggle v-model="asTable" color="primary" label="Ver como tabla" />
      <q-select
        v-if="groupOptions.length"
        v-model="groupFilter"
        :options="groupOptions"
        dense standout clearable
        label="Grupo"
        class="q-ml-sm"
        style="min-width: 140px"
      />
    </div>

    <q-banner class="bg-grey-2 text-grey-8 q-mb-md">
      Placeholder: cálculo en frontend a partir de partidos <strong>finalizados</strong>.
      En el sprint de estadísticas lo moveremos a un servicio/función y cache (standings/{tournamentId}).
    </q-banner>

    <div v-if="loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <!-- Vista TARJETAS -->
    <div
      v-else-if="!asTable"
      class="grid q-col-gutter-md"
      style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));"
    >
      <q-card v-for="row in filteredRows" :key="row.teamId" class="q-pa-md">
        <div class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <q-avatar v-if="teamById(row.teamId)?.crestUrl" size="36px">
              <img :src="teamById(row.teamId)?.crestUrl ?? ''" />
            </q-avatar>
            <div>
              <div class="text-subtitle1">{{ teamById(row.teamId)?.displayName || 'Equipo' }}</div>
              <div class="text-caption text-grey-7">
                PJ {{ row.played }} · DG {{ signed(row.goalDiff) }} · GF {{ row.goalsFor }} · GC {{ row.goalsAgainst }}
              </div>
            </div>
          </div>
          <q-badge color="primary" class="text-body1">{{ row.points }} pts</q-badge>
        </div>

        <q-separator class="q-my-sm" />
        <div class="row items-center text-caption">
          <q-badge class="q-mr-xs" color="positive">G {{ row.won }}</q-badge>
          <q-badge class="q-mr-xs" color="warning">E {{ row.draw }}</q-badge>
          <q-badge class="q-mr-xs" color="negative">P {{ row.lost }}</q-badge>
          <q-space />
          <q-chip v-if="teamById(row.teamId)?.group" dense>
            Grupo {{ teamById(row.teamId)?.group }}
          </q-chip>
        </div>
      </q-card>
    </div>

    <!-- Vista TABLA -->
    <q-table
      v-else
      flat bordered
      :rows="filteredRows"
      :columns="columns"
      row-key="teamId"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <template #body-cell-team="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-sm">
            <q-avatar v-if="teamById(props.row.teamId)?.crestUrl" size="24px">
              <img :src="teamById(props.row.teamId)?.crestUrl ?? ''" />
            </q-avatar>
            <div>{{ teamById(props.row.teamId)?.displayName || 'Equipo' }}</div>
            <q-chip v-if="teamById(props.row.teamId)?.group" dense class="q-ml-xs">
              G{{ teamById(props.row.teamId)?.group }}
            </q-chip>
          </div>
        </q-td>
      </template>
      <template #body-cell-gd="p">
        <q-td :props="p">{{ signed(p.row.goalDiff) }}</q-td>
      </template>
      <template #no-data>
        <div class="full-width row items-center justify-center q-pa-lg text-grey-6">
          No hay datos para mostrar.
        </div>
      </template>
    </q-table>

    <div v-if="!loading && !rows.length" class="q-my-xl text-grey-6">
      <div class="text-subtitle2">No hay información suficiente</div>
      <div class="text-caption">
        Aún no se registran resultados finalizados para generar la tabla.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, defineExpose } from 'vue'
import { useMatchStore } from '@/stores/matches'
import { listTeamsByTournament } from '@/services/teamService'
import type { Match } from '@/types/competition'
import type { Team } from '@/types/auth'
import { Notify } from 'quasar'

const props = defineProps<{ tournamentId: string }>()

type Row = {
  teamId: string
  points: number
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
}

const store = useMatchStore()
const loading = ref<boolean>(false)
const asTable = ref<boolean>(false)

const teams = ref<Team[]>([])
const teamMap = computed<Record<string, Team>>(() =>
  Object.fromEntries(teams.value.map(t => [t.id, t]))
)
function teamById(id: string) { return teamMap.value[id] }

const rows = ref<Row[]>([])

// Filtro por grupo (si existe)
const groupFilter = ref<string | null>(null)
const groupOptions = computed(() => {
  const groups = Array.from(new Set(teams.value.map(t => (t.group || '').trim()).filter(Boolean)))
  return groups.map(g => ({ label: `Grupo ${g}`, value: g }))
})
const filteredRows = computed(() => {
  if (!groupFilter.value) return rows.value
  const set = new Set(teams.value.filter(t => t.group === groupFilter.value).map(t => t.id))
  return rows.value.filter(r => set.has(r.teamId))
})

// Tabla: columnas (compacta)
const columns = [
  { name: 'team',  label: 'Equipo',      align: 'left' as const,  field: 'teamId', sortable: false },
  { name: 'pts',   label: 'Pts',         align: 'right' as const, field: 'points',        sortable: true },
  { name: 'pj',    label: 'PJ',          align: 'right' as const, field: 'played',        sortable: true },
  { name: 'g',     label: 'G',           align: 'right' as const, field: 'won',           sortable: true },
  { name: 'e',     label: 'E',           align: 'right' as const, field: 'draw',          sortable: true },
  { name: 'p',     label: 'P',           align: 'right' as const, field: 'lost',          sortable: true },
  { name: 'gf',    label: 'GF',          align: 'right' as const, field: 'goalsFor',      sortable: true },
  { name: 'gc',    label: 'GC',          align: 'right' as const, field: 'goalsAgainst',  sortable: true },
  { name: 'gd',    label: 'DG',          align: 'right' as const, field: 'goalDiff',      sortable: true }
]

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}

/**
 * Calcula standings con reglas estándar:
 * - Win=3, Draw=1, Loss=0
 * - Orden: Pts desc, DG desc, GF desc
 * - Considera solo partidos "finished"
 */
function computeStandings(matches: Match[]): Row[] {
  const acc = new Map<string, Row>()

  function ensure(teamId: string) {
    if (!acc.has(teamId)) {
      acc.set(teamId, {
        teamId,
        points: 0, played: 0, won: 0, draw: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0
      })
    }
    return acc.get(teamId)!
  }

  for (const m of matches) {
    // Ignora los no finalizados
    if (m.status !== 'terminado') continue

    const home = ensure(typeof m.homeTeamId === 'string' ? m.homeTeamId : m.homeTeamId.id)
    const away = ensure(typeof m.awayTeamId === 'string' ? m.awayTeamId : m.awayTeamId.id)

    const gfH = m.score?.home ?? 0
    const gfA = m.score?.away ?? 0

    home.played += 1
    away.played += 1

    home.goalsFor     += gfH
    home.goalsAgainst += gfA
    away.goalsFor     += gfA
    away.goalsAgainst += gfH

    home.goalDiff = home.goalsFor - home.goalsAgainst
    away.goalDiff = away.goalsFor - away.goalsAgainst

    if (gfH > gfA) { home.won += 1; home.points += 3; away.lost += 1 }
    else if (gfH < gfA) { away.won += 1; away.points += 3; home.lost += 1 }
    else { home.draw += 1; away.draw += 1; home.points += 1; away.points += 1 }
  }

  const list = Array.from(acc.values())
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return 0
  })
  return list
}

async function refetch() {
  loading.value = true
  try {
    // Carga solo partidos finalizados; si tu store no filtra por status, filtra aquí después
    await store.fetch(props.tournamentId, { status: 'terminado' })
    const finals = store.items.filter(m => m.status === 'terminado')
    rows.value = computeStandings(finals)

    // Cargar equipos para nombres/grupos/escudos
    const list = await listTeamsByTournament(props.tournamentId)
    teams.value = list
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo calcular la tabla'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}

defineExpose({ refetch })

onMounted(refetch)
</script>

<style scoped>
.grid { display: grid; }
</style>
