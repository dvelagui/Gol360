<template>
  <q-dialog v-model="model">
    <q-card>
      <!-- Header con gradiente -->
      <div class="profile-header">
        <q-btn
          dense
          round
          flat
          icon="close"
          color="white"
          class="absolute-top-right q-ma-sm"
          v-close-popup
        />
        <div class="row items-center q-pa-lg">
          <q-avatar size="80px" class="shadow-4">
            <img v-if="player?.photoURL" :src="player.photoURL" />
            <q-icon v-else name="person" size="48px" />
          </q-avatar>
          <div class="q-ml-md text-white">
            <div class="text-h5 text-weight-bold">{{ player?.displayName || 'Cargando...' }}</div>
            <div class="text-subtitle2">
              {{ player?.position || 'Sin posición' }}
              <span v-if="player?.jersey" class="q-ml-xs">· #{{ player.jersey }}</span>
            </div>
            <q-badge v-if="player?.role === 'team'" color="amber-7" class="q-mt-xs">
              <q-icon name="star" size="14px" class="q-mr-xs" />
              Capitán
            </q-badge>
          </div>
        </div>
      </div>

      <q-separator />

      <!-- Estadísticas -->
      <q-card-section v-if="!loading">
        <div class="text-subtitle1 text-weight-bold q-mb-md">
          <q-icon name="analytics" color="primary" class="q-mr-xs" />
          Estadísticas
        </div>

        <div v-if="stats" class="row q-col-gutter-md">
          <!-- Goles -->
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi stat-card-goals">
              <q-card-section class="text-center">
                <q-icon name="sports_soccer" size="32px" color="positive" class="q-mb-sm" />
                <div class="text-h4 text-weight-bold">{{ stats.goals }}</div>
                <div class="text-caption text-grey-7">Goles</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Asistencias -->
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi stat-card-assists">
              <q-card-section class="text-center">
                <q-icon name="sports" size="32px" color="info" class="q-mb-sm" />
                <div class="text-h4 text-weight-bold">{{ stats.assists }}</div>
                <div class="text-caption text-grey-7">Asistencias</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Partidos jugados -->
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi stat-card-matches">
              <q-card-section class="text-center">
                <q-icon name="event" size="32px" color="primary" class="q-mb-sm" />
                <div class="text-h4 text-weight-bold">{{ stats.matches }}</div>
                <div class="text-caption text-grey-7">Partidos</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Tarjetas -->
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi stat-card-cards">
              <q-card-section class="text-center">
                <div class="row justify-center items-center q-mb-sm q-gutter-xs">
                  <q-icon name="square" size="20px" color="yellow" />
                  <q-icon name="stop" size="20px" color="red" />
                </div>
                <div class="text-h4 text-weight-bold">
                  <span class="text-warning" color="yellow">{{ stats.yellow }}</span>
                  <span class="q-mx-xs text-grey-5">/</span>
                  <span class="text-negative" color="red">{{ stats.red }}</span>
                </div>
                <div class="text-caption text-grey-7">Tarjetas</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Sin estadísticas -->
        <div v-else class="text-center q-pa-lg">
          <q-icon name="analytics" size="64px" color="grey-4" />
          <div class="text-body1 text-grey-6 q-mt-md">
            Sin estadísticas registradas
          </div>
          <div class="text-caption text-grey-5">
            Las estadísticas aparecerán cuando el jugador participe en partidos
          </div>
        </div>
      </q-card-section>

      <!-- Loading state -->
      <q-card-section v-else>
        <div class="text-center q-pa-lg">
          <q-spinner-dots size="48px" color="primary" />
          <div class="text-body2 text-grey-7 q-mt-md">Cargando estadísticas...</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Player } from '@/types/auth'
import { getPlayer } from '@/services/playerService'
import { getPlayerStats, type PlayerStats } from '@/services/statsService'

const props = defineProps<{
  modelValue: boolean
  playerId: string | null
  role?: 'admin' | 'manager' | 'team' | 'player' | undefined
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const model = ref(props.modelValue)
watch(() => props.modelValue, v => (model.value = v))
watch(model, v => emit('update:modelValue', v))

const player = ref<Player | null>(null)
const stats = ref<PlayerStats | null>(null)
const loading = ref(false)

async function load() {
  if (!props.playerId) {
    player.value = null
    stats.value = null
    return
  }

  loading.value = true
  try {
    // Cargar datos del jugador
    player.value = await getPlayer(props.playerId)

    // Cargar estadísticas del jugador
    stats.value = await getPlayerStats(props.playerId)
  } catch (error) {
    console.error('Error loading player profile:', error)
    player.value = null
    stats.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.playerId, load)
onMounted(load)
</script>

<style scoped lang="scss">
.profile-header {
  background: linear-gradient(135deg, #064F34, #138A59);
  position: relative;
}

.kpi {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.stat-card-goals {
  border-left: 4px solid #21BA45;
}

.stat-card-assists {
  border-left: 4px solid #31CCEC;
}

.stat-card-matches {
  border-left: 4px solid #064F34;
}

.stat-card-cards {
  border-left: 4px solid #F2C037;
}

// Responsive
@media (max-width: 600px) {
  .profile-header {
    .row {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }

    .q-ml-md {
      margin-left: 0 !important;
    }
  }
}
</style>
