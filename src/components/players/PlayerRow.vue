<template>
  <div class="row items-center q-py-sm player-row">
    <div class="col-6 col-md-4 row items-center">
      <q-avatar size="32px" class="q-mr-sm">
        <img :src="avatarUrl || fallbackAvatar" alt="avatar" />
      </q-avatar>
      <div class="text-body2 ellipsis">{{ displayName }}</div>
      <q-badge
        v-if="role === 'team'"
        color="amber-7"
        text-color="black"
        class="q-ml-sm"
        outline
      >
        Capitán
      </q-badge>
    </div>

    <div class="col-1 col-md-1 text-center">{{ stats.goals ?? 0 }}</div>
    <div class="col-1 col-md-1 text-center">{{ stats.played ?? 0 }}</div>
    <div class="col-1 col-md-1 text-center">
      <q-icon name="square" size="10px" class="q-mr-xs text-yellow-8" />
      {{ stats.yellow ?? 0 }}
    </div>
    <div class="col-1 col-md-1 text-center">
      <q-icon name="square" size="10px" class="q-mr-xs text-red" />
      {{ stats.red ?? 0 }}
    </div>
    <div class="col-1 col-md-1 text-center">
      <q-icon name="square" size="10px" class="q-mr-xs text-primary" />
      {{ stats.blue ?? 0 }}
    </div>
    <div class="col-1 col-md-1 text-center">{{ stats.fouls ?? 0 }}</div>
    <div class="col-1 col-md-1 text-center">{{ stats.assists ?? 0 }}</div>

    <div v-if="canEdit" class="col-12 col-md-1 text-right q-mt-xs q-mt-md-none">
      <q-btn flat dense icon="edit" @click="$emit('edit')" />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  displayName: string
  role: 'player' | 'team'
  avatarUrl?: string | null
  stats: PlayerStatsLite
  canEdit?: boolean
}>()

const useProps =  props.displayName

console.log(useProps);

const fallbackAvatar = 'https://cdn.quasar.dev/img/avatar.png'
</script>

<style scoped>
.player-row + .player-row {
  border-top: 1px solid rgba(0,0,0,0.06);
}
</style>
