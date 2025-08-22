<template>
  <q-card class="q-pa-md">
    <div class="text-h6">{{ t.displayName }}</div>
    <div class="text-caption">{{ t.city }} • {{ t.type }}</div>
    <div class="text-caption">Organizador: {{ getManagerName(t.managerId) }}</div>
    <q-btn flat color="primary" label="Ver" @click="$emit('open', t.id)" />
  </q-card>
</template>

<script setup lang="ts">
import type { Tournament } from '@/types/auth'

//hacer una funcion para traer el nombre del manager, teniendo su manager Id
function getManagerName(managerId: string): Promise<string | null> {
  const manager = { displayName: "Organizador", id: managerId }
  return Promise.resolve(manager.displayName)
}


const { t } = defineProps<{ t: Tournament }>()
</script>
