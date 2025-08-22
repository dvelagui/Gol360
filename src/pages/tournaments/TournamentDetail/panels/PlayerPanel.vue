<template>
  <div>
    <!-- Banner del equipo -->
    <div class="team-hero q-mb-md">
      <div class="team-hero__overlay row items-center">
        <q-avatar size="56px" class="q-mr-md">
          <img :src="team.crestUrl || fallbackCrest" alt="team" />
        </q-avatar>
        <div>
          <div class="text-h6 text-white">{{ team.displayName }}</div>
          <div class="text-caption text-white">
            {{ team.city }} <span v-if="team.group">· {{ team.group }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cabecera columnas -->
    <div class="row items-center q-pa-sm bg-white header-row">
      <div class="col-6 col-md-4 text-weight-medium">Jugadores</div>
      <div class="col-1 col-md-1 text-center">G</div>
      <div class="col-1 col-md-1 text-center">J</div>
      <div class="col-1 col-md-1 text-center">T.AM</div>
      <div class="col-1 col-md-1 text-center">T.R</div>
      <div class="col-1 col-md-1 text-center">T.AZ</div>
      <div class="col-1 col-md-1 text-center">FAL</div>
      <div class="col-1 col-md-1 text-center">ASS</div>
      <div class="col-12 col-md-1" />
    </div>

    <!-- Lista -->
    <q-card flat class="q-mt-sm">
      <div v-if="loading" class="q-pa-md">
        <q-skeleton type="text" v-for="i in 6" :key="i" class="q-mb-sm" />
      </div>

      <template v-else>
        <PlayerRow
          v-for="p in players"
          :key="p.id"
          :display-name="p.displayName"
          :role="p.role"
          :avatar-url="p.avatarUrl || null"
          :stats="statsById[p.id] || {}"
          :can-edit="canEditRows"
          @edit="$emit('edit-player', p)"
        />
        <div v-if="!players.length" class="q-pa-md text-grey-6">
          Aún no hay jugadores en este equipo.
        </div>
      </template>
    </q-card>

    <!-- CTA para capitanes / managers -->
    <div v-if="canManage" class="row justify-end q-mt-md">
      <q-btn color="primary" icon="person_add_alt" label="Nuevo jugador" @click="$emit('add-player')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PlayerRow from './PlayerRow.vue'

type TeamLite = {
  id: string
  displayName: string
  city?: string
  group?: string
  crestUrl?: string | null
  captainId?: string | null
}

type PlayerLite = {
  id: string
  displayName: string
  role: 'player' | 'team'
  avatarUrl?: string | null
}

type PlayerStatsLite = {
  goals?: number
  assists?: number
  yellow?: number
  red?: number
  blue?: number
  fouls?: number
  played?: number
}

const props = defineProps<{
  team: TeamLite
  players: PlayerLite[]
  statsById?: Record<string, PlayerStatsLite>   // opcional (si no llega, se muestran 0s)
  loading?: boolean
  role?: 'admin' | 'manager' | 'team' | 'player'
}>()

defineEmits<{
  (e: 'add-player'): void
  (e: 'edit-player', player: PlayerLite): void
}>()

const fallbackCrest = 'https://images.unsplash.com/photo-1521417531056-4433e727a1f5?q=80&w=1600&auto=format&fit=crop'

const canManage = computed(() => props.role === 'admin' || props.role === 'manager' || props.role === 'team')
const canEditRows = computed(() => props.role === 'admin' || props.role === 'manager' || props.role === 'team')

const statsById = computed(() => props.statsById ?? {})
const loading = computed(() => !!props.loading)
</script>

<style scoped>
.team-hero {
  border-radius: 12px;
  background: url('https://images.unsplash.com/photo-1521417531056-4433e727a1f5?q=80&w=1600&auto=format&fit=crop') center/cover no-repeat;
  height: 140px;
  position: relative;
  overflow: hidden;
}
.team-hero__overlay {
  position: absolute;
  inset: 0;
  padding: 16px;
  background: linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.15));
}
.header-row {
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.06);
}
</style>
