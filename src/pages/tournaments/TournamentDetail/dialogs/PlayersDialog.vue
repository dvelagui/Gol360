<template>
  <q-dialog v-model="model" persistent>
    <q-card class="dlg-card">
      <q-card-section class="row items-center">
        <div class="row justify-between items-center text-subtitle1  bg-primary text-white q-pa-md full-width">
          Jugadores — {{ team?.displayName || '' }}
          <q-btn dense round flat icon="close" v-close-popup />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="store.loading" class="q-gutter-sm">
          <q-skeleton type="rect" height="64px" />
          <q-skeleton type="rect" height="64px" />
          <q-skeleton type="rect" height="64px" />
        </div>

        <div v-else class="players-grid">
          <q-btn v-if="canManagePlayers" outline icon="person_add" color="primary" label="Agregar Jugador"
            @click="showCreateAccount = true" />

          <q-card v-for="p in store.items" :key="p.id" class="p-card" flat bordered>
            <div class="row items-center no-wrap">
              <q-avatar size="56px" class="q-mr-md">
                <img :src="p.photoURL || defaultAvatar" alt="player" />
              </q-avatar>

              <div class="col">
                <div class="row items-center no-wrap">
                  <div class="text-body1 ellipsis">{{ p.displayName }}</div>
                  <q-badge v-if="p.role === 'team'" color="warning" class="q-ml-sm" label="Capitán" />
                </div>
                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ p.position || '—' }}
                  <span class="q-ml-xs">·</span>
                  <span class="q-ml-xs">{{ p.jersey ? ('#' + p.jersey) : 's/n' }}</span>
                </div>
              </div>

              <div class="row items-center q-gutter-xs q-ml-sm">
                <q-btn v-if="canManagePlayers && p.role !== 'team'" dense flat round color="warning"
                  icon="military_tech" :title="'Marcar capitán'" @click="makeCaptain(p.id)" />
                <q-btn v-if="canManagePlayers" dense flat round color="primary" icon="edit" :title="'Editar'"
                  @click="openEdit(p)" />
                <q-btn v-if="canManagePlayers" dense flat round color="negative" icon="delete" :title="'Eliminar'"
                  @click="removePlayer(p.id)" />
              </div>
            </div>
          </q-card>
        </div>

        <div v-if="!store.loading && !store.items.length" class="q-mt-lg text-grey-6">
          <div class="text-subtitle2">Aún no hay jugadores</div>
          <div class="text-caption">
            Agrega el primero con la tarjeta “Agregar jugador”.
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showForm" persistent>
      <q-card class="subdlg-card">
        <q-card-section class="row items-center">
          <div class="text-subtitle1">
            {{ editId ? 'Editar jugador' : 'Nuevo jugador' }}
          </div>
          <q-space />
          <q-btn dense round flat icon="close" v-close-popup />
        </q-card-section>
        <q-separator />

      </q-card>
    </q-dialog>
    <PlayerAccountFormDialog v-model="showCreateAccount" :tournament-id="tournamentId" :team="team" @created="async () => {
      if (team?.id) await store.fetchByTeam(team.id)
    }" />
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import { usePlayerStore } from '@/stores/players'
import type { Team } from '@/types/auth'
import type { Player } from '@/types/auth'
import { defineAsyncComponent } from 'vue'
const PlayerAccountFormDialog = defineAsyncComponent(() =>
  import('./PlayerAccountFormDialog.vue')
)


const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  team: Team | null
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const store = usePlayerStore()
const defaultAvatar = 'https://firebasestorage.googleapis.com/v0/b/gol360-app.firebasestorage.app/o/avatar%2Fplayer.png?alt=media&token=0175081b-9761-4acb-9e15-a77baf10b7f0'
const showCreateAccount = ref(false)

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const canManagePlayers = computed(() => {
  if (props.role === 'admin' || props.role === 'manager') return true
  if (props.role === 'team' && props.team) return true
  return false
})

/* Sub-diálogo PlayerForm */
const showForm = ref(false)
const editId = ref<string | null>(null)
const playerModel = ref<Partial<Player>>({})


function openEdit(p: Player) {
  editId.value = p.id
  playerModel.value = { ...p }
  showForm.value = true
}



async function removePlayer(id: string) {
  try {
    await store.remove(id)
    Notify.create({ type: 'positive', message: 'Jugador eliminado' })
    if (props.team) await store.fetchByTeam(props.team.id)
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo eliminar jugador' })
  }
}

async function makeCaptain(playerId: string) {
  try {
    await store.setCaptain(props.team!.id, playerId)
    Notify.create({ type: 'positive', message: 'Capitán asignado' })
    if (props.team) await store.fetchByTeam(props.team.id)
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo asignar capitán' })
  }
}

watch(() => props.team?.id, async (id) => {
  if (model.value && id) await store.fetchByTeam(id)
})

onMounted(async () => {
  if (model.value && props.team?.id) await store.fetchByTeam(props.team.id)
})
</script>

<style scoped lang="scss">
/* Dialog shells */
.dlg-card {
  min-width: 300px;
  width: min(960px, 95vw);
}

.subdlg-card {
  min-width: 300px;
  width: min(640px, 95vw);
}

/* Grid responsive */
.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

/* Card look & feel */
.p-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .06);
  transition: transform .12s ease, box-shadow .12s ease;
  padding: 3px;
}

.p-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, .10);
}

/* Add card center content */
.p-body {
  min-height: 140px;
  text-align: center;
}

@media (max-width: 599px) {
  .players-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 420px) {
  .players-grid {
    grid-template-columns: 1fr;
  }
}
</style>
