<!-- src/pages/tournaments/TournamentDetail/panels/TeamsPanel.vue -->
<template>
  <div class="q-pa-none">
    <!-- Encabezado -->
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Equipos</div>
      <q-space />
      <!-- Botón quitado: usamos card fantasma -->
    </div>

    <!-- Skeleton -->
    <div v-if="store.loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <!-- Grid con tarjetas -->
    <div v-else class="flex flex-wrap q-gutter-md list-teams">
      <!-- Card: Agregar equipo (solo si se puede gestionar, faltan equipos y no mostramos la de calendario) -->
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
            Una vez complete los equipos podrá generar <strong>calendario de partidos</strong>.
          </div>
        </div>
      </q-card>

      <!-- Card: Generar calendario (aparece si está completo el cupo) -->
      <CalendarGeneratorCard
        v-else-if="canManage && isFull"
        class="tcard"
        :tournament-id="props.tournamentId"
        :teams="store.items"
        :phase-hint="existingMatches ? 'eliminatorias' : 'fase 1'"
        @generated="onGenerated"
      />

      <!-- Cards de equipos -->
      <q-card
        v-for="t in store.items"
        :key="t.id"
        class="tcard cursor-pointer column justify-between"
        flat
        bordered
      >
        <div class="row items-center justify-between">
          <p
            v-if="canManage"
            class="text-body2 q-pa-sm text-primary q-mb-none"
            @click="$emit('edit-team', t)"
          >
            Editar
          </p>
          <q-btn
            v-if="canManage"
            class="btn-badget"
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
            <q-avatar
              v-if="t.crestUrl"
              size="60px"
              class="q-mb-sm"
              color="primary"
              text-color="white"
            >
              <img :src="t.crestUrl" />
            </q-avatar>
            <q-avatar
              v-else
              size="60px"
              class="q-mb-sm"
              color="primary"
              text-color="white"
            >
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineExpose, computed, ref, watch, defineAsyncComponent } from 'vue'
import { useTeamStore } from '@/stores/teams'
import { usePlayerStore } from '@/stores/players'
import { Notify } from 'quasar'
import type { Team, Tournament } from '@/types/auth'
import { hasMatches } from '@/services/matchService'

const CalendarGeneratorCard = defineAsyncComponent(
  () => import('@/components/tournaments/CalendarGeneratorCard.vue')
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

/* Permisos */
const canManage = computed(() => props.role === 'admin' || props.role === 'manager')

/* Store equipos */
const store = useTeamStore()
const existingMatches = ref<boolean>(false)
async function fetchNow() {
  await store.fetch(props.tournamentId)
  existingMatches.value = await hasMatches(props.tournamentId)
}
defineExpose({ refetch: fetchNow })
onMounted(fetchNow)

/* Mostrar nombre del capitán */
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

/* Cupos y visibilidad de cards fantasma */
const isFull = computed(() => store.items.length >= (props.tournamentDetail.numTeams || 0))
const remainingTeams = computed(() =>
  Math.max((props.tournamentDetail?.numTeams ?? 0) - store.items.length, 0)
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

/* Feedback cuando CalendarGeneratorCard termina */
async function onGenerated() {
  Notify.create({ type: 'positive', message: 'Calendario generado' })
  await fetchNow()
}
</script>

<style scoped lang="scss">
.list-teams {
  justify-content: start;
}

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
