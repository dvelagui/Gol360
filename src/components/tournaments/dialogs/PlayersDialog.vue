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

    <!-- Diálogo de edición de jugador -->
    <q-dialog v-model="showForm" persistent>
      <q-card class="subdlg-card">
        <q-card-section class="row items-center bg-primary text-white">
          <div class="text-subtitle1">Editar Jugador</div>
          <q-space />
          <q-btn dense round flat icon="close" color="white" v-close-popup />
        </q-card-section>
        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="saveEdit" class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <!-- Nombre -->
              <div class="col-12">
                <q-input
                  v-model="playerModel.displayName"
                  label="Nombre del jugador"
                  filled
                  dense
                  :rules="[val => !!val || 'El nombre es requerido']"
                >
                  <template #prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>
              </div>

              <!-- Posición -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="playerModel.position"
                  label="Posición (opcional)"
                  filled
                  dense
                  hint="Ej: Delantero, Portero, etc."
                >
                  <template #prepend>
                    <q-icon name="sports" />
                  </template>
                </q-input>
              </div>

              <!-- Dorsal -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="playerModel.jersey"
                  type="number"
                  label="Dorsal"
                  filled
                  dense
                  min="0"
                  max="99"
                >
                  <template #prepend>
                    <q-icon name="tag" />
                  </template>
                </q-input>
              </div>

              <!-- Capitán toggle -->
              <div class="col-12">
                <div class="row items-center q-py-sm">
                  <q-toggle
                    v-model="isEditCaptain"
                    color="warning"
                    class="q-mr-sm"
                  />
                  <q-icon
                    name="military_tech"
                    :color="isEditCaptain ? 'warning' : 'grey-5'"
                    size="20px"
                    class="q-mr-xs"
                  />
                  <span>Marcar como Capitán del equipo</span>
                </div>
              </div>
            </div>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
              <q-btn
                type="submit"
                unelevated
                label="Guardar cambios"
                color="primary"
                icon="save"
                :loading="savingEdit"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
    <PlayerAccountFormDialog v-model="showCreateAccount" :tournament-id="tournamentId" :team="team" @created="async () => {
      if (team?.id) await store.fetchByTeamWithParticipations(team.id)
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
const isEditCaptain = ref(false)
const savingEdit = ref(false)

function openEdit(p: Player) {
  editId.value = p.id
  playerModel.value = { ...p }
  isEditCaptain.value = p.role === 'team'
  showForm.value = true
}

async function saveEdit() {
  if (!editId.value || !props.team?.id || !props.tournamentId) return

  savingEdit.value = true
  try {
    const player = store.items.find(p => p.id === editId.value)
    if (!player) {
      Notify.create({ type: 'negative', message: 'Jugador no encontrado' })
      return
    }

    // Obtener la participación (el player del store incluye participation)
    type PlayerWithParticipation = Player & { participation?: { id: string; jersey?: number; position?: string; role?: 'player' | 'team' } }
    const participation = (player as PlayerWithParticipation).participation
    if (!participation?.id) {
      Notify.create({ type: 'negative', message: 'No se encontró la participación del jugador' })
      return
    }

    // Preparar datos de actualización
    const updateData: Partial<{ position: string; jersey: number; role: 'player' | 'team' }> = {
      role: isEditCaptain.value ? 'team' : 'player'
    }

    // Solo agregar campos opcionales si tienen valor
    if (playerModel.value.position !== undefined && playerModel.value.position !== null) {
      updateData.position = playerModel.value.position
    }
    if (playerModel.value.jersey !== undefined && playerModel.value.jersey !== null) {
      updateData.jersey = playerModel.value.jersey
    }

    // Actualizar datos de la participación
    await store.updateParticipation(participation.id, updateData)

    // Si cambió el estado de capitán, actualizar todos los capitanes del equipo
    if (isEditCaptain.value !== (player.role === 'team')) {
      await store.setCaptainWithParticipations(
        props.team.id,
        props.tournamentId,
        isEditCaptain.value ? editId.value : null
      )
    }

    // Actualizar nombre del jugador en el documento principal
    if (playerModel.value.displayName !== player.displayName) {
      await store.update(editId.value, {
        displayName: playerModel.value.displayName || ''
      })
    }

    Notify.create({ type: 'positive', message: 'Jugador actualizado correctamente' })
    showForm.value = false

    // Refrescar lista
    await store.fetchByTeamWithParticipations(props.team.id)
  } catch (error) {
    console.error('Error updating player:', error)
    Notify.create({ type: 'negative', message: 'No se pudo actualizar el jugador' })
  } finally {
    savingEdit.value = false
  }
}



async function removePlayer(id: string) {
  try {
    // Buscar la participación del jugador en este equipo
    const player = store.items.find(p => p.id === id)
    if (!player) {
      Notify.create({ type: 'negative', message: 'Jugador no encontrado' })
      return
    }

    // Obtener el ID de la participación
    type PlayerWithParticipation = Player & { participation?: { id: string } }
    const participation = (player as PlayerWithParticipation).participation
    if (participation?.id) {
      // Desactivar la participación en lugar de eliminar el jugador
      await store.deactivatePlayerFromTeam(participation.id)
      Notify.create({ type: 'positive', message: 'Jugador removido del equipo' })
    } else {
      // Fallback: eliminar jugador si no tiene participación
      await store.remove(id)
      Notify.create({ type: 'positive', message: 'Jugador eliminado' })
    }

    // Refrescar lista
    if (props.team) await store.fetchByTeamWithParticipations(props.team.id)
  } catch (error) {
    console.error('Error removing player:', error)
    Notify.create({ type: 'negative', message: 'No se pudo eliminar jugador' })
  }
}

async function makeCaptain(playerId: string) {
  if (!props.team?.id || !props.tournamentId) {
    Notify.create({ type: 'negative', message: 'Faltan datos del equipo o torneo' })
    return
  }

  try {
    // Usar el nuevo sistema de participaciones
    await store.setCaptainWithParticipations(props.team.id, props.tournamentId, playerId)
    Notify.create({ type: 'positive', message: 'Capitán asignado correctamente' })

    // Refrescar lista con participaciones
    await store.fetchByTeamWithParticipations(props.team.id)
  } catch (error) {
    console.error('Error setting captain:', error)
    Notify.create({ type: 'negative', message: 'No se pudo asignar capitán' })
  }
}

watch(() => props.team?.id, async (id) => {
  if (model.value && id) await store.fetchByTeamWithParticipations(id)
})

onMounted(async () => {
  if (model.value && props.team?.id) await store.fetchByTeamWithParticipations(props.team.id)
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
