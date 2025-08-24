<template>
  <div class="q-pa-none">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Equipos</div>
      <q-space />
      <q-btn
        v-if="canManage"
        color="primary" icon="group_add" label="Nuevo equipo"
        @click="$emit('create-team')"
      />
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
      <q-card v-for="t in store.items" :key="t.id" class="q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-avatar v-if="t.crestUrl" size="42px"><img :src="t.crestUrl" /></q-avatar>
          <div>
            <div class="text-subtitle1">{{ t.displayName }}</div>
            <div class="text-caption text-grey-7">
              {{ t.city || '—' }} <span v-if="t.group">· Grupo {{ t.group }}</span>
            </div>
            <div class="text-caption" v-if="t.captainId">Capitán: <span v-if="captainNames[t.captainId]">{{ captainNames[t.captainId] }}</span><span v-else>—</span></div>
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
      <div class="text-caption">Crea el primero con “Nuevo equipo”.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineExpose, computed } from 'vue'
import { useTeamStore } from '@/stores/teams'
import { Notify } from 'quasar'
import type { Team } from '@/types/auth'
import type { Tournament } from '@/types/auth'

import { usePlayerStore } from '@/stores/players'

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

async function fetchNow() { await store.fetch(props.tournamentId) }
defineExpose({ refetch: fetchNow })

onMounted(fetchNow)

const playerStore = usePlayerStore()

import { ref, watch } from 'vue'
const captainNames = ref<Record<string, string>>({})

watch(
  () => store.items.map(t => t.captainId),
  async (captainIds) => {
    for (const id of captainIds) {
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
    Notify.create({ type: 'negative', message: `No se pudo eliminar el equipo: {${String(e)}}` })
  }
}
</script>

<style scoped>
.grid { display: grid; }
</style>
