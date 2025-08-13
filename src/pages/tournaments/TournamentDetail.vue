<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Torneo</div>
        <div class="text-caption text-grey-7">ID: {{ tId }}</div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          v-if="canCreateMatch"
          color="primary"
          icon="event"
          label="Nuevo partido"
          @click="openCreate"
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
                  dense
                  flat
                  icon="summarize"
                  color="primary"
                  label="Resultados"
                  @click="openResults(m)"
                />
                <q-btn
                  v-if="canEditMatch"
                  dense
                  flat
                  icon="edit"
                  color="primary"
                  @click="openEdit(m)"
                />
                <q-btn
                  v-if="canEditMatch"
                  dense
                  flat
                  icon="delete"
                  color="negative"
                  @click="onRemove(m.id)"
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

    <!-- DIALOG: RESULTADOS Y EVENTOS -->
    <q-dialog v-model="showResults" persistent>
      <q-card style="min-width: 760px; max-width: 95vw;">
        <q-card-section class="row items-center">
          <div class="text-subtitle1">Resultados y eventos</div>
          <q-space />
          <q-btn dense round flat icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="resultsMatch">
          <ResultsForm
            :match="resultsMatch"
            :teams="teams"
            :can-edit="canEditMatch"
            :can-propose="role === 'team'"
            @confirm="onConfirm"
            @addEvent="openAddEvent"
            @approve="approveEv"
            @reject="rejectEv"
            @remove="removeEv"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- DIALOG: NUEVO EVENTO -->
    <q-dialog v-model="showAddEvent">
      <q-card style="min-width: 600px; max-width: 95vw;">
        <q-card-section class="row items-center">
          <div class="text-subtitle1">Nuevo evento</div>
          <q-space />
          <q-btn dense round flat icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="resultsMatch">
          <MatchEventForm
            :match-id="resultsMatch.id"
            :tournament-id="tId"
            :teams="teams"
            :can-approve="role === 'admin' || role === 'manager'"
            @submit="submitEvent"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'

import MatchForm from '@/components/tournaments/MatchForm.vue'
import MatchCard from '@/components/tournaments/MatchCard.vue'
import ResultsForm from '@/components/tournaments/ResultForm.vue'
import MatchEventForm from '@/components/tournaments/MatchEventForm.vue'

import { useMatchStore } from '@/stores/matches'
import { useEventStore } from '@/stores/events'
import { useDatabaseStore } from '@/stores/database'
import { listTeamsByTournament } from '@/services/teamService'
import { confirmResult, setMatchScore } from '@/services/matchService'

import type { Match, MatchEvent, MatchPhase, MatchStatus } from '@/types/competition'

/* Tipos locales */
type Role = 'admin' | 'manager' | 'team' | 'player' | undefined

interface TeamMin { id: string; name: string }
interface MatchFormModel {
  tournamentId: string
  round: string
  phase: MatchPhase
  dateISO: string
  field?: string
  referee?: string
  homeTeamId: string
  awayTeamId: string
  notes?: string
}

const route = useRoute()
const router = useRouter()
const tId = route.params.id as string

const tab = ref<'schedule'|'standings'|'leaders'>('schedule')

const mStore = useMatchStore()
const eStore = useEventStore()
const database = useDatabaseStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const editingModel = ref<MatchFormModel | null>(null)

const teams = ref<TeamMin[]>([])

const statusFilter = ref<MatchStatus | null>(null)
const phaseFilter  = ref<MatchPhase  | null>(null)

const statusOptions: MatchStatus[] = ['scheduled','in_progress','finished','canceled','walkover']
const phaseOptions: MatchPhase[] = ['regular','playoff','semifinal','final']

/* Permisos */
const role = computed<Role>(() => database.userData?.role)
const canCreateMatch = computed<boolean>(() => role.value === 'admin' || role.value === 'manager')
const canEditMatch   = canCreateMatch

/* Helpers */
function teamById(id: string): TeamMin | undefined {
  return teams.value.find(t => t.id === id)
}

function toDateLocalInput(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm
}

/* Lifecycle */
onMounted(async () => {
  await Promise.all([ mStore.fetch(tId), loadTeams() ])
})

watch([statusFilter, phaseFilter], async () => {
  const filter: { status?: MatchStatus; phase?: MatchPhase } = {};
  if (statusFilter.value !== null) filter.status = statusFilter.value;
  if (phaseFilter.value !== null) filter.phase = phaseFilter.value;
  await mStore.fetch(tId, filter)
})

async function loadTeams (): Promise<void> {
  try {
    const list = await listTeamsByTournament(tId)
    teams.value = list.map(t => ({ id: t.id, name: t.displayName }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error cargando equipos'
    Notify.create({ type: 'negative', message: msg })
  }
}

/* CRUD Partidos */
function openCreate(): void {
  editingId.value = null
  editingModel.value = null
  showForm.value = true
}

function openEdit(m: Match): void {
  editingId.value = m.id

  const model: MatchFormModel = {
    tournamentId: m.tournamentId,
    round: String(m.round),
    phase: m.phase,
    dateISO: toDateLocalInput(m.date),
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    ...(m.field ?   { field: m.field }     : {}),
    ...(m.referee ? { referee: m.referee } : {}),
    ...(m.notes ?   { notes: m.notes }     : {}),
  }

  editingModel.value = model
  showForm.value = true
}


function closeForm(): void {
  showForm.value = false
  editingId.value = null
  editingModel.value = null
}

async function onSave(model: MatchFormModel): Promise<void> {
  try {
    if (editingId.value) {
      // ---- UPDATE (arma el patch sin undefined) ----
      const patch: Partial<Match> = {
        round: model.round,
        phase: model.phase,
        date: new Date(model.dateISO).getTime(),
        homeTeamId: model.homeTeamId,
        awayTeamId: model.awayTeamId,
        ...(model.field    ? { field: model.field }       : {}),
        ...(model.referee  ? { referee: model.referee }   : {}),
        ...(model.notes    ? { notes: model.notes }       : {}),
      }
      await mStore.update(editingId.value, patch)
      Notify.create({ type: 'positive', message: 'Partido actualizado' })
    } else {
      // ---- CREATE (igual que lo tenías) ----
      const payload = {
        tournamentId: tId,
        round: model.round,
        phase: model.phase,
        dateISO: model.dateISO,
        field: model.field,
        referee: model.referee,
        homeTeamId: model.homeTeamId,
        awayTeamId: model.awayTeamId,
        notes: model.notes
      }
      await mStore.create(payload as unknown as any)
      Notify.create({ type: 'positive', message: 'Partido creado' })
      const filter: { status?: MatchStatus; phase?: MatchPhase } = {};
      if (statusFilter.value !== null) filter.status = statusFilter.value;
      if (phaseFilter.value !== null) filter.phase = phaseFilter.value;
      await mStore.fetch(tId, filter)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error guardando partido'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    closeForm()
  }
}


async function onRemove(id: string): Promise<void> {
  try {
    await mStore.remove(id)
    Notify.create({ type: 'positive', message: 'Partido eliminado' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo eliminar'
    Notify.create({ type: 'negative', message: msg })
  }
}

/* Resultados y eventos (Paquete 2) */
const showResults = ref(false)
const resultsMatch = ref<Match | null>(null)
const showAddEvent = ref(false)

function openResults(m: Match): void {
  resultsMatch.value = m
  showResults.value = true
}

async function onConfirm(score: { home: number; away: number }): Promise<void> {
  if (!resultsMatch.value) return
  const by: 'admin' | 'manager' = role.value === 'admin' ? 'admin' : 'manager'
  try {
    await setMatchScore(resultsMatch.value.id, score)
    await confirmResult(resultsMatch.value.id, by, score)
    const filter: { status?: MatchStatus; phase?: MatchPhase } = {};
    if (statusFilter.value !== null) filter.status = statusFilter.value;
    if (phaseFilter.value !== null) filter.phase = phaseFilter.value;
    await mStore.fetch(tId, filter)
    Notify.create({ type: 'positive', message: 'Marcador confirmado' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo confirmar'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    showResults.value = false
  }
}

function openAddEvent(): void {
  showAddEvent.value = true
}

async function submitEvent(
  payload: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'proposed' | 'approved' }
): Promise<void> {
  try {
    const base: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> = {
      matchId: payload.matchId,
      tournamentId: payload.tournamentId,
      teamId: payload.teamId,
      // playerId puede ser null; lo incluimos siempre
      playerId: payload.playerId ?? null,
      type: payload.type,
      minute: typeof payload.minute === 'number' ? payload.minute : 0,
      createdBy: payload.createdBy
    }

    // construir el objeto final SIN undefined en opcionales
    const normalized: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'proposed' | 'approved' } = {
      ...base,
      ...(payload.extraTime !== undefined ? { extraTime: payload.extraTime } : {}),
      ...(payload.meta !== undefined ? { meta: payload.meta } : {}),
      ...(payload.status ? { status: payload.status } : {})
    }

    await eStore.create(normalized)
    Notify.create({ type: 'positive', message: 'Evento agregado' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo agregar evento'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    showAddEvent.value = false
  }
}

async function approveEv(id: string): Promise<void> {
  if (!resultsMatch.value) return
  await eStore.approve(id, resultsMatch.value.id)
}
async function rejectEv(id: string): Promise<void> {
  if (!resultsMatch.value) return
  await eStore.reject(id, resultsMatch.value.id)
}
async function removeEv(id: string): Promise<void> {
  if (!resultsMatch.value) return
  await eStore.remove(id, resultsMatch.value.id)
}

/* Computed */
const filteredMatches = computed<Match[]>(() => mStore.items)

function goBack(): void {
  router.back()
}
</script>

<style scoped lang="scss">
.grid { display: grid; }
.rounded-borders { border-radius: 12px; }
</style>
