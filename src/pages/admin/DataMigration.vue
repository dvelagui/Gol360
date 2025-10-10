<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h4">
        <q-icon name="storage" class="q-mr-sm" />
        Migración de Datos
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12">
        <MigrationPanel />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const MigrationPanel = defineAsyncComponent(() =>
  import('@/components/admin/MigrationPanel.vue')
)
</script>
