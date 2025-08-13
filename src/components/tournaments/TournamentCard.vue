<template>
  <q-card class="q-pa-md">
    <div class="text-h6">{{ t.displayName }}</div>
    <div class="text-caption">{{ t.city }} • {{ t.type }}</div>
    <div class="text-caption">Organizer: {{ t.managerId }}</div>
    <q-btn flat color="primary" label="Ver" @click="$emit('open', t.id)" />
  </q-card>
</template>

<script setup lang="ts">
import type { Tournament } from '@/types/auth'
const { t } = defineProps<{ t: Tournament }>()
</script>
