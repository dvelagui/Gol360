<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 520px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">Perfil del jugador</div>
        <q-space />
        <q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="player" class="row q-col-gutter-md">
          <div class="col-12">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="56px"><q-icon name="person" /></q-avatar>
              <div>
                <div class="text-h6">{{ player.displayName }}</div>
                <div class="text-caption text-grey-7">
                  {{ player.position || '—' }} <span v-if="player.jersey">· #{{ player.jersey }}</span>
                </div>
                <q-badge v-if="player.role === 'team'" color="amber-7" outline>Capitán</q-badge>
              </div>
            </div>
          </div>

          <!-- KPIs básicos (placeholder) -->
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi">
              <q-card-section class="text-center">
                <div class="text-h5">0</div>
                <div class="text-caption text-grey-7">Goles</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi">
              <q-card-section class="text-center">
                <div class="text-h5">0</div>
                <div class="text-caption text-grey-7">Asistencias</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi">
              <q-card-section class="text-center">
                <div class="text-h5">0</div>
                <div class="text-caption text-grey-7">Amarillas</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="kpi">
              <q-card-section class="text-center">
                <div class="text-h5">0</div>
                <div class="text-caption text-grey-7">Rojas</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <div v-else class="text-grey-7">Cargando…</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Player } from '@/types/auth'
import { getPlayer } from '@/services/playerService'

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

async function load() {
  player.value = props.playerId ? await getPlayer(props.playerId) : null
}

watch(() => props.playerId, load)
onMounted(load)
</script>

<style scoped>
.kpi { border-radius: 12px; }
</style>
