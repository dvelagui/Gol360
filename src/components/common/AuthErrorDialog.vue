<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="q-pa-md" style="min-width: 360px; border-radius: 18px;">
      <div class="row items-center q-gutter-sm q-mb-sm">
        <q-icon name="error_outline" color="negative" size="28px" />
        <div class="text-h6">No pudimos iniciar sesión</div>
      </div>

      <q-card-section class="q-pt-none">
        <div class="text-body2">{{ message }}</div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-md">
        <q-btn flat color="primary" no-caps @click="onDialogCancel">Recuperar contraseña</q-btn>
        <q-btn unelevated color="primary" no-caps @click="onDialogOK">Salir</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
defineProps<{ message: string }>()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>
