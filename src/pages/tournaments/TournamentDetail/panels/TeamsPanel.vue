<template>
  <div class="q-pa-none">
    <!-- Encabezado -->
    <div class="row items-center q-mb-sm">
      <q-space />
      <!-- Botón “Nuevo” eliminado; lo reemplaza la card fantasma -->
    </div>

    <!-- skeleton -->
    <div v-if="store.loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <!-- grid -->
    <div v-else class="flex flex-wrap q-gutter-md list-teams" >
      <!-- Card fantasma: Agregar equipo / Generar calendario -->
      <q-card v-if="canManage && remainingTeams > 0" class="tcard cursor-pointer column justify-between" flat bordered
        @click="$emit('create-team')">
        <div class="tcard__body flex column items-center justify-center q-pa-lg">
          <q-avatar size="72px" class="bg-primary text-white">
            <q-icon name="group_add" size="40px" />
          </q-avatar>
          <div class="text-h6 q-mt-md">Agregar equipo</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Faltan <b>{{ remainingTeams }}</b> para completar {{ tournamentDetail.numTeams }}.
          </div>
          <div class="text-caption text-grey-7 q-mt-lg">
            Una vez complete los equipos podra generar <strong>calendario de partidos</strong>
          </div>
        </div>
      </q-card>

      <!-- Card fantasma: Generar calendario (aparece cuando el cupo está completo) -->
      <q-card v-else-if="canManage && store.items.length > 1" class="tcard cursor-pointer column justify-between" flat
        bordered @click="openGenerateDialog">
        <div class="tcard__body flex column items-center justify-center q-pa-md">
          <q-avatar size="72px" class="bg-primary text-white">
            <q-icon name="calendar_month" size="40px" />
          </q-avatar>
          <div class="text-h6 q-mt-md">Generar calendario</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ store.items.length }} equipos listos · Configura grupos y partidos.
          </div>
        </div>
      </q-card>

      <!-- Cards de equipos -->
      <q-card v-for="t in store.items" :key="t.id" class="tcard cursor-pointer column justify-between" flat bordered>
        <div class="row items-center justify-between">
          <p class="text-body2 q-pa-sm" v-if="canManage" flat color="primary" @click="$emit('edit-team', t)" >Editar</p>
          <q-btn class="btn-badget" v-if="canManage" dense flat round color="negative" icon="delete" @click="onRemove(t.id)" />
        </div>
        <div class="q-px-lg q-pb-md column ">
          <div class="text-center">
            <q-avatar v-if="t.crestUrl" size="60px" class="q-mb-sm" color="primary" text-color="white">
              <img :src="t.crestUrl" />
            </q-avatar>
            <q-avatar v-else size="60px" class="q-mb-sm" color="primary" text-color="white">
              <q-icon name="shield" />
            </q-avatar>

          </div>

          <div class="text-subtitle1 q-mb-xs">{{ t.displayName }}</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ t.city || '—' }} <span v-if="t.group">· Grupo {{ t.group }}</span>
          </div>
          <div class="text-caption text-grey-8 q-mb-md">
            Capitán:
            <span v-if="t.captainId">
              {{ captainNames[t.captainId] ?? '—' }}
            </span>
            <span v-else>—</span>
          </div>

          <q-separator />

          <div class="q-pa-xs">
            <q-btn class="q-mt-md full-width" color="accent" text-color="primary" label="Jugadores" unelevated
              @click="$emit('open-players', t)" />
          </div>
        </div>
      </q-card>
    </div>

    <div v-if="!store.loading && !store.items.length" class="q-my-xl text-grey-6">
      <div class="text-subtitle2">Aún no hay equipos</div>
      <div class="text-caption">Agrega el primero con la tarjeta “Agregar equipo”.</div>
    </div>

    <!-- Dialog: Generar calendario -->
    <q-dialog v-model="showGen">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center">
          <div class="text-subtitle1">Generar calendario</div>
          <q-space />
          <q-btn dense round flat icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-toggle v-model="formGen.allPlayAll" label="Todos contra todos (un solo grupo)" />
            </div>

            <div class="col-12" v-if="!formGen.allPlayAll">
              <q-input v-model.number="formGen.groups" type="number" label="Número de grupos" :min="1" :max="maxGroups"
                dense filled />
              <div class="text-caption text-grey-7 q-mt-xs">
                Máximo sugerido: {{ maxGroups }} (≥ 2 equipos por grupo)
              </div>
            </div>

            <div class="col-12">
              <q-option-group v-model="formGen.mode" type="radio" :options="[
                { label: 'Solo ida', value: 'single' },
                { label: 'Ida y vuelta', value: 'double' }
              ]" dense />
            </div>

            <div class="col-12">
              <q-input v-model="formGen.startISO" type="datetime-local" label="Fecha y hora de inicio (opcional)"
                hint="Si lo dejas vacío: mañana 09:00" dense filled />
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Generar" :loading="genLoading" @click="generateCalendar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineExpose, computed, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { useTeamStore } from '@/stores/teams'
import { usePlayerStore } from '@/stores/players'
import { useUserStore } from '@/stores/user'
import { createMatch } from '@/services/matchService' // reusamos tu servicio
import type { Team, Tournament } from '@/types/auth'
import type { Match } from '@/types/competition' // Asegúrate de que la ruta sea correcta

const props = defineProps<{
  tournamentId: string
  tournamentDetail: Tournament
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()

defineEmits<{
  (e: 'create-team'): void
  (e: 'edit-team', team: Team): void
  (e: 'open-players', team: Team): void
}>()

/* --- Permisos --- */
const canManage = computed(() => props.role === 'admin' || props.role === 'manager')

/* --- Store de equipos --- */
const store = useTeamStore()
async function fetchNow() { await store.fetch(props.tournamentId) }
defineExpose({ refetch: fetchNow })
onMounted(fetchNow)

/* --- Mostrar nombre del capitán --- */
const playerStore = usePlayerStore()
const captainNames = ref<Record<string, string>>({})
watch(
  () => store.items.map(t => t.captainId),
  async (ids) => {
    for (const id of ids) {
      if (id && !captainNames.value[id]) {
        const p = await playerStore.fetchById(id)
        captainNames.value[id] = p ? p.displayName : '—'
      }
    }
  },
  { immediate: true }
)

/* --- Contador de cupos restantes --- */
const remainingTeams = computed(() =>
  Math.max((props.tournamentDetail?.numTeams ?? 0) - store.items.length, 0)
)

/* --- Eliminar equipo --- */
async function onRemove(id: string) {
  try {
    await store.remove(id)
    Notify.create({ type: 'positive', message: 'Equipo eliminado' })
    await fetchNow()
  } catch (e) {
    Notify.create({ type: 'negative', message: `No se pudo eliminar el equipo: ${String(e)}` })
  }
}

/* ===========================================================
   GENERACIÓN DE CALENDARIO
   - Todos contra todos o por grupos
   - Ida o ida/vuelta
   - Fechas: desde “mañana 09:00”, cada partido +2h
   - Guarda en matches usando matchService.createMatch
   =========================================================== */
const showGen = ref(false)
const genLoading = ref(false)

const formGen = ref({
  allPlayAll: true,
  groups: 2,
  mode: 'single' as 'single' | 'double',
  startISO: '' // si vacío -> mañana 09:00
})

const maxGroups = computed(() => {
  // sugerimos como máximo la cantidad que permita mínimo 2 por grupo
  const n = store.items.length
  return Math.max(1, Math.floor(n / 2))
})

function openGenerateDialog() {
  // default sugerido: todos contra todos si equipos <= 8
  formGen.value.allPlayAll = store.items.length <= 8
  formGen.value.groups = Math.min(maxGroups.value, 2)
  formGen.value.mode = 'single'
  formGen.value.startISO = ''
  showGen.value = true
}

/* helpers */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
 /*  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  } */
  return a
}

/** Algoritmo "circle method" para round-robin */
function buildRoundRobin(ids: string[]): Array<Array<[string, string]>> {
  const teams = ids.slice()
  if (teams.length % 2 === 1) teams.push('__BYE__') // impar -> fecha libre
  const n = teams.length
  const rounds: Array<Array<[string, string]>> = []

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i]
      const away = teams[n - 1 - i]
      if (
        home !== '__BYE__' &&
        away !== '__BYE__' &&
        typeof home === 'string' &&
        typeof away === 'string'
      ) {
        pairs.push([home, away])
      }
    }
    rounds.push(pairs)
    // rotación
    const rest = teams.slice(1)
    const popped = rest.pop()
    if (popped !== undefined) {
      rest.unshift(popped)
    }

    teams.splice(0, teams.length, ...rest.filter((x): x is string => typeof x === 'string'))
  }
  return rounds
}

function splitIntoGroups<T>(items: T[], k: number): T[][] {
  const out: Array<Array<T>> = Array.from({ length: k }, () => [])
  const shuffled = shuffle(items)
  for (let i = 0; i < shuffled.length; i++) {
    out[i % k]!.push(shuffled[i] as T)
  }
  return out
}

function startDateISO(): string {
  if (formGen.value.startISO) return formGen.value.startISO
  const d = new Date()
  d.setDate(d.getDate() + 1) // mañana
  d.setHours(9, 0, 0, 0)
  // yyyy-MM-ddTHH:mm (input local)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

async function generateCalendar() {
  try {
    genLoading.value = true

    const uid = useUserStore().user?.uid ?? ''
    const teams = store.items.map(t => ({ id: t.id, name: t.displayName }))
    if (teams.length < 2) {
      Notify.create({ type: 'warning', message: 'Se requieren al menos 2 equipos.' })
      return
    }

    // grupos
    const groups: Array<Array<{ id: string; name: string }>> =
      formGen.value.allPlayAll
        ? [teams]
        : splitIntoGroups(teams, Math.max(1, Math.min(formGen.value.groups, maxGroups.value)))

    // fecha/hora de inicio
    const baseISO = startDateISO()
    let current = new Date(baseISO) // local
    // Normalizamos a Date real
    const toISO = (d: Date) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

    let created = 0
    let fase = 1

    for (const group of groups) {
      const ids = group.map(g => g.id)
      const rr = buildRoundRobin(ids) // rondas (fechas)
      const rounds = formGen.value.mode === 'double'
        ? [...rr, ...rr.map(pairs => pairs.map(([a, b]) => [b, a]))]
        : rr

      let fechaIdx = 1
      for (const pairs of rounds) {
        for (const [homeId, awayId] of pairs) {
          const home = group.find(g => g.id === homeId)
          const away = group.find(g => g.id === awayId)
          if (!home || !away) continue
          const payload = {
            tournamentId: props.tournamentId,
            round: `Fecha ${fechaIdx}`,
            phase: (groups.length > 1 ? `Fase ${fase}` : 'Regular') as Match['phase'],
            dateISO: toISO(current),
            date: current.getTime(),
            field: '', // se define luego
            referee: '',
            homeTeamId: { id: home.id, name: home.name },
            awayTeamId: { id: away.id, name: away.name },
            notes: ''
          }
          await createMatch(payload, { uid }) // firma existente en tu servicio
          created++
          // siguiente partido: +2 horas
          current = new Date(current.getTime() + 2 * 60 * 60 * 1000)
        }
        // siguiente fecha (ronda): día siguiente 09:00
        current.setDate(current.getDate() + 1)
        current.setHours(9, 0, 0, 0)
        fechaIdx++
      }
      fase++
    }

    Notify.create({ type: 'positive', message: `Calendario generado: ${created} partidos` })
    showGen.value = false
  } catch (e) {
    Notify.create({ type: 'negative', message: `Error generando calendario: ${String(e)}` })
  } finally {
    genLoading.value = false
  }
}
</script>

<style scoped lang="scss">

.list-teams {
  justify-content: space-between;
}

.grid {
  display: grid;
}

/* Card estilo “Gol360” (igual a TournamentList) */
.tcard {
  max-width: 250px;
  min-width: 250px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .06);
  transition: transform .12s ease, box-shadow .12s ease;
}

.tcard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, .10);
}
.btn-badget {
  box-shadow: none;
  transition: background-color .12s ease, color .12s ease;
  font-size: 10px;
}

@media screen and (max-width: 720px) {
  .list-teams {
    justify-content: center;
  }
}
</style>
