<template>
  <div class="q-pa-none">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Equipos</div>
      <q-space />
    </div>

    <div v-if="store.loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <div v-else class="flex flex-wrap q-gutter-md list-teams">
      <q-card
        v-if="canManage && remainingTeams > 0"
        class="tcard cursor-pointer column justify-between"
        flat
        bordered
        @click="$emit('create-team')"
      >
        <div class="tcard__body flex column items-center justify-center q-pa-lg">
          <q-avatar size="72px" class="bg-primary text-white">
            <q-icon name="group_add" size="40px" />
          </q-avatar>
          <div class="text-h6 q-mt-md">Agregar equipo</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Faltan <b>{{ remainingTeams }}</b> para completar {{ props.tournamentDetail.numTeams }}.
          </div>
          <div class="text-caption text-grey-7 q-mt-lg">
            Una vez complete los equipos podrá generar el <strong>calendario de partidos</strong>.
          </div>
        </div>
      </q-card>

      <q-card
        v-else-if="canManage && isFull"
        class="tcard cursor-pointer column justify-between"
        flat
        bordered
      >
        <div class="tcard__body flex column items-center justify-center q-pa-md">
          <q-avatar size="72px" class="bg-primary text-white">
            <q-icon name="calendar_month" size="40px" />
          </q-avatar>
          <div class="text-h6 q-mt-md">Calendario</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ store.items.length }} equipos listos
          </div>
          <div class="q-mt-md full-width q-px-md">
            <q-btn
              color="primary"
              label="Configurar y generar"
              class="full-width"
              @click="openGenerateDialog"
              :disable="genDisabled"
            />
          </div>
          <div class="text-caption text-grey-7 q-mt-xs" v-if="genDisabled">
            (Deshabilitado: ya existen partidos no terminados)
          </div>
        </div>
      </q-card>

      <q-card
        v-for="t in store.items"
        :key="t.id"
        class="tcard cursor-pointer column justify-between"
        flat
        bordered
      >
        <div class="row items-center justify-between">
          <p
            class="text-body2 q-pa-sm"
            v-if="canManage"
            flat
            color="primary"
            @click="$emit('edit-team', t)"
          >
            Editar
          </p>
          <q-btn
            class="btn-badget"
            v-if="canManage"
            dense
            flat
            round
            color="negative"
            icon="delete"
            @click="onRemove(t.id)"
          />
        </div>

        <div class="q-px-lg q-pb-md column">
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
            <q-btn
              class="q-mt-md full-width"
              color="accent"
              text-color="primary"
              label="Jugadores"
              unelevated
              @click="$emit('open-players', t)"
            />
          </div>
        </div>
      </q-card>
    </div>

    <div v-if="!store.loading && !store.items.length" class="q-my-xl text-grey-6">
      <div class="text-subtitle2">Aún no hay equipos</div>
      <div class="text-caption">Agrega el primero con la tarjeta “Agregar equipo”.</div>
    </div>

    <CalendarGeneratorDialog
      v-model="showGen"
      :tournament-id="props.tournamentId"
      :teams="store.items"
      :existing-matches="existingMatches"
      @generated="onGenerated"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineExpose, computed, ref, watch, defineAsyncComponent } from 'vue'
import { Notify } from 'quasar'
import { useTeamStore } from '@/stores/teams'
import { usePlayerStore } from '@/stores/players'
import type { Team, Tournament } from '@/types/auth'
import { hasMatches } from '@/services/matchService'

const CalendarGeneratorDialog = defineAsyncComponent(
  () => import('../dialogs/CalendarGeneratorDialog.vue')
)

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

const store = useTeamStore()
const canManage = computed(() => props.role === 'admin' || props.role === 'manager')
const isFull = computed(() => store.items.length >= (props.tournamentDetail.numTeams || 0))
const remainingTeams = computed(() =>
  Math.max((props.tournamentDetail?.numTeams ?? 0) - store.items.length, 0)
)

const existingMatches = ref(false)
const genDisabled = ref(false)

async function fetchNow() {
  await store.fetch(props.tournamentId)
  // existen partidos en el torneo?
  existingMatches.value = await hasMatches(props.tournamentId)
  // deshabilitar si hay partidos no terminados
  genDisabled.value = await hasUnfinished(props.tournamentId)
}
defineExpose({ refetch: fetchNow })
onMounted(fetchNow)

/** Comprueba si hay partidos con status != 'terminado' */
async function hasUnfinished(tournamentId: string): Promise<boolean> {
  // pequeña utilidad basada en tu matchService (si ya tienes algo similar, reúsalo)
  const { listMatchesByTournament } = await import('@/services/matchService')
  const all = await listMatchesByTournament(tournamentId)
  return all.some(m => m.status !== 'terminado')
}

/* Capitanes (muestra nombre) */
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

/* Eliminar equipo */
async function onRemove(id: string) {
  try {
    await store.remove(id)
    Notify.create({ type: 'positive', message: 'Equipo eliminado' })
    await fetchNow()
  } catch (e: unknown) {
    Notify.create({ type: 'negative', message: `No se pudo eliminar el equipo: ${String(e)}` })
  }
}

/* Dialog */
const showGen = ref(false)
function openGenerateDialog() {
  if (genDisabled.value) return
  showGen.value = true
}
async function onGenerated() {
  Notify.create({ type: 'positive', message: 'Calendario generado' })
  showGen.value = false
  await fetchNow()
}
</script>

<style scoped lang="scss">
.list-teams { justify-content: space-between; }
.grid { display: grid; }

/* Card estilo “Gol360” */
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
  .list-teams { justify-content: center; }
}
</style>
