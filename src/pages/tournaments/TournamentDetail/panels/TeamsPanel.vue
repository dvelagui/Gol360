<template>
  <div class="q-pa-none">

    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Equipos</div>
      <q-space />
      <!-- Quitamos el botón y lo pasamos a card de agregar -->
    </div>

    <div v-if="store.loading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <div
      v-else
      class="grid q-col-gutter-md"
      style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));"
    >
      <!-- Card “Agregar equipo” -->
      <q-card
        v-if="canManage"
        class="q-pa-lg flex flex-center column cursor-pointer shadow-2 rounded-borders"
        @click="$emit('create-team')"
      >
        <q-avatar size="52px" class="q-mb-sm bg-primary text-white">
          <q-icon name="group_add" />
        </q-avatar>
        <div class="text-subtitle1 q-mb-xs">Agregar equipo</div>
        <div class="text-caption text-grey-7">
          {{ store.items.length }}/{{ props.tournamentDetail.numTeams }} registrados
        </div>
      </q-card>

      <!-- Card Generar calendario (solo si ya están completos) -->
      <CalendarGeneratorCard
        v-if="canManage && isFull"
        :tournament-id="props.tournamentId"
        :teams="store.items"
        :phase-hint="existingMatches ? 'eliminatorias' : 'fase 1'"
        @generated="onGenerated"
      />

      <!-- Cards de equipos -->
      <q-card v-for="t in store.items" :key="t.id" class="q-pa-md shadow-2 rounded-borders">
        <div class="row items-center q-gutter-sm">
          <q-avatar v-if="t.crestUrl" size="42px"><img :src="t.crestUrl" /></q-avatar>
          <div>
            <div class="text-subtitle1">{{ t.displayName }}</div>
            <div class="text-caption text-grey-7">
              {{ t.city || '—' }} <span v-if="t.group">· Grupo {{ t.group }}</span>
            </div>
            <div class="text-caption" v-if="t.captainId">
              Capitán:
              <span v-if="captainNames[t.captainId]">{{ captainNames[t.captainId] }}</span>
              <span v-else>—</span>
            </div>
          </div>
        </div>

        <div class="row q-gutter-xs q-mt-sm">
          <q-btn dense flat icon="badge" label="Jugadores" color="primary" @click="$emit('open-players', t)" />
          <q-space />
          <q-btn v-if="canManage" dense flat icon="edit" color="primary" @click="$emit('edit-team', t)" />
          <q-btn v-if="canManage" dense flat icon="delete" color="negative" @click="onRemove(t.id)" />
        </div>
      </q-card>
    </div>

    <div v-if="!store.loading && !store.items.length" class="q-my-xl text-grey-6">
      <div class="text-subtitle2">Aún no hay equipos</div>
      <div class="text-caption">Crea el primero con “Agregar equipo”.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineExpose, computed, ref, watch, defineAsyncComponent } from 'vue'
import { useTeamStore } from '@/stores/teams'
import { Notify } from 'quasar'
import type { Team, Tournament } from '@/types/auth'
import { usePlayerStore } from '@/stores/players'
import { hasMatches } from '@/services/matchService'

const CalendarGeneratorCard = defineAsyncComponent(() => import('@/components/tournaments/CalendarGeneratorCard.vue'))

const props = defineProps<{
  tournamentId: string,
  tournamentDetail: Tournament,
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()

defineEmits<{
  (e:'create-team'): void
  (e:'edit-team', team: Team): void
  (e:'open-players', team: Team): void
}>()

const store = useTeamStore()
const canManage = computed(() => props.role === 'admin' || props.role === 'manager')
const isFull = computed(() => store.items.length >= (props.tournamentDetail.numTeams || 0))

const existingMatches = ref(false)

async function fetchNow() {
  await store.fetch(props.tournamentId)
  existingMatches.value = await hasMatches(props.tournamentId)
}
defineExpose({ refetch: fetchNow })
onMounted(fetchNow)

const playerStore = usePlayerStore()
const captainNames = ref<Record<string, string>>({})

watch(
  () => store.items.map(t => t.captainId),
  async (ids) => {
    for (const id of ids) {
      if (id && !captainNames.value[id]) {
        const player = await playerStore.fetchById(id)
        captainNames.value[id] = player ? player.displayName : '—'
      }
    }
  },
  { immediate: true }
)

async function onRemove(id: string) {
  try {
    await store.remove(id)
    Notify.create({ type: 'positive', message: 'Equipo eliminado' })
    await fetchNow()
  } catch (e: unknown) {
    Notify.create({ type: 'negative', message: `No se pudo eliminar el equipo: ${String(e)}` })
  }
}

function onGenerated() {
  Notify.create({ type:'positive', message:'Calendario generado' })
}
</script>

<style scoped>
.grid { display: grid; }
.rounded-borders { border-radius: 12px; }
</style>
