<!-- src/pages/tournaments/TournamentDetail.vue -->
<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Torneo</div>
        <div class="text-caption text-grey-7">ID: {{ tId }}</div>
      </div>

      <div class="row q-gutter-sm">
        <!-- Botón crear partido solo para admin/manager -->
        <q-btn
          v-if="canCreateMatch"
          color="primary"
          icon="event"
          label="Nuevo partido"
          @click="openCreate()"
        />
        <q-btn flat icon="arrow_back" label="Volver" @click="goBack" />
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="tab"
      class="bg-transparent text-primary"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="schedule" label="Programación" icon="calendar_month" />
      <q-tab name="standings" label="Tabla" icon="leaderboard" />
      <q-tab name="leaders" label="Rankings" icon="emoji_events" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <q-tab-panels v-model="tab" animated swipeable>
      <!-- PROGRAMACIÓN -->
      <q-tab-panel name="schedule" class="q-pa-none">
        <div class="row items-center q-mb-sm">
          <q-space />
          <q-select
            v-model="statusFilter"
            :options="statusOptions"
            dense
            standout
            label="Estado"
            clearable
            class="q-mr-sm"
            style="min-width: 160px"
          />
          <q-select
            v-model="phaseFilter"
            :options="phaseOptions"
            dense
            standout
            label="Fase"
            clearable
            style="min-width: 160px"
          />
        </div>

        <div v-if="mStore.loading" class="q-my-xl">
          <q-skeleton type="rect" class="q-mb-md" height="120px" />
          <q-skeleton type="rect" class="q-mb-md" height="120px" />
          <q-skeleton type="rect" class="q-mb-md" height="120px" />
        </div>

        <div
          v-else
          class="grid q-col-gutter-md"
          style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));"
        >
          <MatchCard
            v-for="m in filteredMatches"
            :key="m.id"
            :match="m"
            :team-by-id="teamById"
          >
            <template #actions>
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn
                  dense flat icon="edit" color="primary"
                  @click="openEdit(m)"
                  v-if="canEditMatch"
                />
                <q-btn
                  dense flat icon="delete" color="negative"
                  @click="onRemove(m.id)"
                  v-if="canEditMatch"
                />
              </div>
            </template>
          </MatchCard>
        </div>

        <div v-if="!mStore.loading && !mStore.items.length" class="q-my-xl text-grey-6">
          <div class="text-subtitle1 q-mb-xs">No hay partidos programados</div>
          <div class="text-caption">Crea el primero con el botón “Nuevo partido”.</div>
        </div>
      </q-tab-panel>

      <!-- TABLA - placeholder -->
      <q-tab-panel name="standings" class="q-pa-none">
        <div class="q-pa-md bg-grey-1 rounded-borders">
          <div class="text-subtitle1 q-mb-sm">Tabla de posiciones</div>
          <div class="text-caption q-mb-md">
            Próximo: StandingsBoard (tarjetas) + toggle a StandingsTable.
          </div>

          <q-banner class="bg-grey-2 text-grey-8">
            Módulo en construcción. Aquí mostraremos puntos, PJ, DG, GF, GC por equipo.
          </q-banner>
        </div>
      </q-tab-panel>

      <!-- RANKINGS - placeholder -->
      <q-tab-panel name="leaders" class="q-pa-none">
        <div class="q-pa-md bg-grey-1 rounded-borders">
          <div class="text-subtitle1 q-mb-sm">Rankings</div>
          <div class="text-caption q-mb-md">
            Próximo: carruseles de Goleadores, Valla menos vencida, Disciplina, etc.
          </div>

          <q-banner class="bg-grey-2 text-grey-8">
            Módulo en construcción. Mostraremos top scorers y mejores defensas.
          </q-banner>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- DIALOG: CREAR/EDITAR PARTIDO -->
    <q-dialog v-model="showForm" persistent>
      <q-card style="min-width: 720px; max-width: 95vw;">
        <q-card-section class="row items-center">
          <div class="text-subtitle1">
            {{ editingId ? 'Editar partido' : 'Nuevo partido' }}
          </div>
          <q-space />
          <q-btn dense round flat icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <MatchForm
            :tournament-id="tId"
            :teams="teams"
            :model-value="editingModel"
            @save="onSave"
            @cancel="closeForm"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'

import MatchForm from '@/components/tournaments/MatchForm.vue'
import MatchCard from '@/components/tournaments/MatchCard.vue'

import { useMatchStore } from '@/stores/matches'
import { useDatabaseStore } from '@/stores/database' // donde tienes userData.role
import { listTeamsByTournament } from '@/services/teamService'

import type { Match, MatchPhase, MatchStatus, Team } from '@/types/competition' // ajusta si Team está en otro archivo

/** Tipos auxiliares */
type AppRole = 'admin' | 'manager' | 'team' | 'player'

type MatchFormModel =
  | {
      tournamentId: string
      round: number | string
      phase: MatchPhase
      dateISO: string // yyyy-MM-ddTHH:mm
      field?: string
      referee?: string
      homeTeamId: string
      awayTeamId: string
      notes?: string
    }
  | null

type MatchFetchFilters = Partial<{
  status: MatchStatus
  phase: MatchPhase
  round: string | number
}>

/** route + base state */
const route = useRoute()
const router = useRouter()
const tId = route.params.id as string

const tab = ref<'schedule' | 'standings' | 'leaders'>('schedule')

/** stores */
const mStore = useMatchStore()
const database = useDatabaseStore()

/** UI state */
const showForm = ref(false)
const editingId = ref<string | null>(null)
const editingModel = ref<MatchFormModel>(null)

/** teams in tournament (id, name) */
const teams = ref<{ id: string; name: string }[]>([])

/** filters */
const statusFilter = ref<MatchStatus | null>(null)
const phaseFilter = ref<MatchPhase | null>(null)

const statusOptions: MatchStatus[] = ['scheduled', 'in_progress', 'finished', 'canceled', 'walkover']
const phaseOptions: MatchPhase[] = ['regular', 'playoff', 'semifinal', 'final']

/** permissions by role */
function isAppRole(v: unknown): v is AppRole {
  return v === 'admin' || v === 'manager' || v === 'team' || v === 'player'
}
const role = computed<AppRole | undefined>(() =>
  isAppRole(database.userData?.role) ? (database.userData!.role as AppRole) : undefined
)
const canCreateMatch = computed(() => role.value === 'admin' || role.value === 'manager')
const canEditMatch = canCreateMatch // mismo criterio por ahora

/** helpers */
function teamById(id: string) {
  return teams.value.find((t) => t.id === id)
}
function getTeamNameSafe(t: Team): string {
  const cand = (t as unknown as { name?: string; displayName?: string }).name
    ?? (t as unknown as { name?: string; displayName?: string }).displayName
  return cand ?? 'Sin nombre'
}

/** lifecycle */
onMounted(async () => {
  await Promise.all([mStore.fetch(tId), loadTeams()])
})

watch([statusFilter, phaseFilter], async () => {
  const filters: MatchFetchFilters = {}
  if (statusFilter.value) filters.status = statusFilter.value
  if (phaseFilter.value) filters.phase = phaseFilter.value
  await mStore.fetch(tId, filters)
})

async function loadTeams() {
  try {
    const list = await listTeamsByTournament(tId)
    // Normaliza a { id, name } sin asumir que Team tiene "name" en su tipo
    teams.value = list.map((t) => ({ id: t.id, name: getTeamNameSafe(t as unknown as Team) }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos'
    Notify.create({ type: 'negative', message: msg })
  }
}

/** CRUD dialog */
function openCreate() {
  editingId.value = null
  editingModel.value = null
  showForm.value = true
}

function openEdit(m: Match) {
  editingId.value = m.id
  // adaptamos a modelo de MatchForm (usa dateISO)
  const dateISO = new Date(m.date).toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm
  editingModel.value = {
    tournamentId: m.tournamentId,
    round: m.round,
    phase: m.phase,
    dateISO,
    field: m.field,
    referee: m.referee || '',
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    notes: m.notes || ''
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  editingModel.value = null
}

async function onSave(formPayload: NonNullable<MatchFormModel>) {
  try {
    if (editingId.value) {
      // update
      const patch: Partial<Match> = {
        round: formPayload.round,
        phase: formPayload.phase,
        date: new Date(formPayload.dateISO).getTime(),
        homeTeamId: formPayload.homeTeamId,
        awayTeamId: formPayload.awayTeamId
      }
      if (formPayload.field !== undefined) patch.field = formPayload.field
      if (formPayload.referee !== undefined) patch.referee = formPayload.referee
      if (formPayload.notes !== undefined) patch.notes = formPayload.notes
      await mStore.update(editingId.value, patch)
      Notify.create({ type: 'positive', message: 'Partido actualizado' })
    } else {
      // create
      const payload = {
        ...formPayload,
        tournamentId: tId
      }
      await mStore.create(payload)
      Notify.create({ type: 'positive', message: 'Partido creado' })
      // refresca lista manteniendo filtros activos sin undefined
      const filters: MatchFetchFilters = {}
      if (statusFilter.value) filters.status = statusFilter.value
      if (phaseFilter.value) filters.phase = phaseFilter.value
      await mStore.fetch(tId, filters)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error guardando partido'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    closeForm()
  }
}

async function onRemove(id: string) {
  try {
    await mStore.remove(id)
    Notify.create({ type: 'positive', message: 'Partido eliminado' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo eliminar'
    Notify.create({ type: 'negative', message: msg })
  }
}

function goBack() {
  router.back()
}

/** computed: filtered matches (extra filtro por round si luego lo agregas) */
const filteredMatches = computed(() => {
  return mStore.items
})
</script>

<style scoped lang="scss">
.grid {
  display: grid;
}
.rounded-borders {
  border-radius: 12px;
}
</style>
