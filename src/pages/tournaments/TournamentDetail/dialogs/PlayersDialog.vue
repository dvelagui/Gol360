<template>
  <q-dialog v-model="model" persistent>
    <q-card style="min-width: 720px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">Jugadores — {{ team?.displayName || '' }}</div>
        <q-space />
        <q-btn
          v-if="canManagePlayers"
          dense flat icon="person_add" color="primary" label="Nuevo"
          @click="openCreate"
        />
        <q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section>
        <div v-if="store.loading">
          <q-skeleton type="text" width="60%" />
          <q-skeleton type="text" />
        </div>

        <div v-else>
          <q-list bordered separator>
            <q-item v-for="p in store.items" :key="p.id">
              <q-item-section>
                <q-item-label>
                  {{ p.displayName }}
                  <q-badge v-if="p.role==='team'" color="warning" class="q-ml-sm">Capitán</q-badge>
                </q-item-label>
                <q-item-label caption>
                  {{ p.position || '—' }} · {{ p.jersey ? ('#'+p.jersey) : 's/n' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side class="row q-gutter-xs">
                <q-btn
                  v-if="canManagePlayers && p.role !== 'team'"
                  dense flat icon="military_tech" color="warning"
                  @click="makeCaptain(p.id)"
                />
                <q-btn
                  v-if="canManagePlayers"
                  dense flat icon="edit" color="primary"
                  @click="openEdit(p)"
                />
                <q-btn
                  v-if="canManagePlayers"
                  dense flat icon="delete" color="negative"
                  @click="removePlayer(p.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>

    <!-- Sub‑diálogo: formulario de jugador -->
    <q-dialog v-model="showForm">
      <q-card style="min-width: 560px; max-width: 95vw;">
        <q-card-section class="row items-center">
          <div class="text-subtitle1">{{ editId ? 'Editar jugador' : 'Nuevo jugador' }}</div>
          <q-space /><q-btn dense round flat icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="team">
          <PlayerForm
            :tournament-id="team.tournamentId"
            :team-id="team.id"
            :model-value="playerModel"
            @save="(payload) => savePlayer({ ...payload, createdBy: playerModel.createdBy || '' })"
            @cancel="() => (showForm=false)"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import { usePlayerStore } from '@/stores/players'
import PlayerForm from '@/components/tournaments/PlayerForm.vue'
import type { Team } from '@/types/auth'
import type { Player } from '@/types/auth'

const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  team: Team | null
  role?: 'admin'|'manager'|'team'|'player'
}>()
const emit = defineEmits<{ (e:'update:modelValue', v:boolean): void }>()

const store = usePlayerStore()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const canManagePlayers = computed(() => {
  if (props.role === 'admin' || props.role === 'manager') return true
  if (props.role === 'team' && props.team) return true // NOTE: puedes filtrar a su propio team si lo requieres
  return false
})

/* Sub‑diálogo PlayerForm */
const showForm    = ref(false)
const editId      = ref<string | null>(null)
const playerModel = ref<Partial<Player>>({})

function openCreate() {
  editId.value = null
  playerModel.value = {
    createdBy: '' // Set this to the current user's ID as appropriate
  }
  showForm.value = true
}
function openEdit(p: Player) {
  editId.value = p.id
  playerModel.value = { ...p }
  showForm.value = true
}

async function savePlayer(payload: Omit<Player, 'id' | 'createdBy' | 'createdAt'> & { createdBy: string }) {
  try {
    if (editId.value) {
      await store.update(editId.value, payload)
      Notify.create({ type: 'positive', message: 'Jugador actualizado' })
    } else {
      await store.add(payload)
      Notify.create({ type: 'positive', message: 'Jugador creado' })
    }
    showForm.value = false
    if (props.team) await store.fetch(props.team.id)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error guardando jugador'
    Notify.create({ type: 'negative', message: msg })
  }
}

async function removePlayer(id: string) {
  try {
    await store.remove(id)
    Notify.create({ type: 'positive', message: 'Jugador eliminado' })
    if (props.team) await store.fetch(props.team.id)
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo eliminar jugador' })
  }
}

async function makeCaptain(playerId: string) {
  try {
    await store.setCaptain(props.team!.id, playerId)
    Notify.create({ type: 'positive', message: 'Capitán asignado' })
    if (props.team) await store.fetch(props.team.id)
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo asignar capitán' })
  }
}

watch(() => props.team?.id, async (id) => {
  if (model.value && id) await store.fetch(id)
})

onMounted(async () => {
  if (model.value && props.team?.id) await store.fetch(props.team.id)
})
</script>
