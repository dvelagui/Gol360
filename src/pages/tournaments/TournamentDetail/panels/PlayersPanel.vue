<template>
  <div class="q-pa-md">

    <!-- Selector de equipo -->
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-select
        v-model="selectedTeamId"
        :options="teamOptions"
        option-value="id"
        option-label="name"
        dense filled
        label="Equipo"
        style="min-width: 260px"
      />
      <q-space />
      <q-badge v-if="team" outline color="primary">
        {{ players.length }} jugador(es)
      </q-badge>
    </div>

    <!-- Encabezado visual del equipo -->
    <div v-if="team" class="header-card q-mb-md">
      <div class="header-overlay">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="56px" class="bg-white">
            <img v-if="team.crestUrl" :src="team.crestUrl" alt="crest" />
            <q-icon v-else name="emoji_events" />
          </q-avatar>
          <div>
            <div class="text-h6 text-white">{{ team.displayName }}</div>
            <div class="text-caption text-white text-weight-regular">
              {{ team.city }} <span v-if="team.group"> · {{ team.group }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla tipo “scoreboard” -->
    <q-markup-table flat bordered class="rounded-borders">
      <thead>
        <tr>
          <th class="text-left">Jugadores</th>
          <th class="text-center">G</th>
          <th class="text-center">J</th>
          <th class="text-center">T.AM</th>
          <th class="text-center">T.R</th>
          <th class="text-center">T.AZ</th>
          <th class="text-center">FAL</th>
          <th class="text-center">ASS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in players" :key="p.id" class="row-click" @click="emitOpen(p.id)">
          <td class="text-left">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="32px">
                <q-icon name="person" />
              </q-avatar>
              <div>
                <div class="text-body1">{{ p.displayName }}</div>
                <div class="text-caption text-grey-7">
                  {{ p.position || '—' }} <span v-if="p.jersey"> · #{{ p.jersey }}</span>
                  <q-badge v-if="p.role === 'team'" color="amber-7" class="q-ml-xs" outline>Capitán</q-badge>
                </div>
              </div>
            </div>
          </td>
          <!-- Métricas (placeholder funcional) -->
          <td class="text-center">{{ p.stats.goals }}</td>
          <td class="text-center">{{ p.stats.matches }}</td>
          <td class="text-center"><q-icon name="circle" size="10px" class="text-amber" /> {{ p.stats.yellow }}</td>
          <td class="text-center"><q-icon name="circle" size="10px" class="text-negative" /> {{ p.stats.red }}</td>
          <td class="text-center"><q-icon name="circle" size="10px" class="text-primary" /> {{ p.stats.blue }}</td>
          <td class="text-center">{{ p.stats.fouls }}</td>
          <td class="text-center">{{ p.stats.assists }}</td>
        </tr>
        <tr v-if="!players.length">
          <td colspan="8" class="text-center text-grey-7">Sin jugadores</td>
        </tr>
      </tbody>
    </q-markup-table>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTeamStore } from '@/stores/teams'
import { usePlayerStore } from '@/stores/players'
import type { Team } from '@/types/auth'

type Role = 'admin' | 'manager' | 'team' | 'player' | undefined

const props = defineProps<{
  tournamentId: string
  role?: Role
}>()

const emit = defineEmits<{
  (e: 'open-profile', playerId: string): void
}>()

const teamStore = useTeamStore()
const playerStore = usePlayerStore()

const selectedTeamId = ref({ id: '', name: '' })

const teamOptions = computed(() =>
  teamStore.items.map(t => ({ id: t.id, name: t.displayName }))
)

const team = computed<Team | null>(() =>
  teamStore.items.find(t => t.id === selectedTeamId.value.id) ?? null
)

const players = computed(() =>
  playerStore.items.map(p => ({
    ...p,
    // placeholders de stats (cero) hasta conectar con statsService
    stats: { goals: 0, matches: 0, yellow: 0, red: 0, blue: 0, fouls: 0, assists: 0 }
  }))
)

function emitOpen(id: string) {
  emit('open-profile', id)
}

watch(selectedTeamId, async (value) => {
  if (value.id) await playerStore.fetchByTeam(value.id)
})

onMounted(async () => {
  // cargar equipos del torneo
  await teamStore.fetch(props.tournamentId)
  // seleccionar primero disponible
  if (!selectedTeamId.value && teamStore.items.length) {
    if (teamStore.items[0]) {
      selectedTeamId.value = { id: teamStore.items[0].id, name: teamStore.items[0].displayName }
    }
  }
  // cargar jugadores del primero
  if (selectedTeamId.value && selectedTeamId.value.id) {
    await playerStore.fetchByTeam(selectedTeamId.value.id)
  }
})
</script>

<style scoped lang="scss">
.rounded-borders { border-radius: 12px; }
.header-card {
  position: relative;
  height: 140px;
  border-radius: 12px;
  background: linear-gradient(135deg, #064F34, #138A59);
  overflow: hidden;
}
.header-overlay {
  position: absolute; inset: 0;
  padding: 16px;
  display: flex; align-items: flex-end;
  background: radial-gradient(ellipse at 80% 20%, rgba(255,255,255,.12), transparent 40%);
}
.row-click { cursor: pointer; }
</style>
