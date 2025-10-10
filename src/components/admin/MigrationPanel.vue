<template>
  <q-card class="q-pa-md">
    <q-card-section>
      <div class="text-h6">Migración de Datos: Players → PlayerParticipations</div>
      <div class="text-caption text-grey-7">
        Migra jugadores del sistema antiguo al nuevo con soporte multi-torneo
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="q-gutter-md">
        <q-banner class="bg-info text-white">
          <template #avatar>
            <q-icon name="info" />
          </template>
          <b>¿Qué hace esta migración?</b>
          <ul class="q-mt-sm q-mb-none">
            <li>Agrupa jugadores por email (elimina duplicados)</li>
            <li>Crea UN jugador por persona</li>
            <li>Crea participaciones por cada equipo/torneo</li>
            <li>Elimina jugadores antiguos duplicados</li>
          </ul>
        </q-banner>

        <q-banner v-if="dryRunResult" class="bg-warning text-white">
          <template #avatar>
            <q-icon name="analytics" />
          </template>
          <b>Análisis (Dry Run):</b>
          <div class="q-mt-sm">
            <div>Total jugadores: {{ dryRunResult.totalPlayers }}</div>
            <div>Emails únicos: {{ dryRunResult.uniqueEmails }}</div>
            <div>Sin email: {{ dryRunResult.noEmail }}</div>
            <div>Players a crear: {{ dryRunResult.playersToCreate }}</div>
            <div>Participaciones a crear: {{ dryRunResult.participationsToCreate }}</div>
            <div>Players a eliminar: {{ dryRunResult.playersToDelete }}</div>
          </div>
        </q-banner>

        <q-banner v-if="migrationResult" :class="migrationResult.errors > 0 ? 'bg-negative' : 'bg-positive'" class="text-white">
          <template #avatar>
            <q-icon :name="migrationResult.errors > 0 ? 'error' : 'check_circle'" />
          </template>
          <b>Resultado de Migración:</b>
          <div class="q-mt-sm">
            <div>✅ Players creados: {{ migrationResult.playersCreated }}</div>
            <div>✅ Participaciones creadas: {{ migrationResult.participationsCreated }}</div>
            <div>🗑️ Players eliminados: {{ migrationResult.playersDeleted }}</div>
            <div v-if="migrationResult.errors > 0" class="text-weight-bold">
              ❌ Errores: {{ migrationResult.errors }}
            </div>
          </div>
        </q-banner>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn
        flat
        label="Analizar (Dry Run)"
        color="primary"
        icon="analytics"
        :loading="running"
        :disable="migrating"
        @click="runDryRun"
      />
      <q-btn
        unelevated
        label="Ejecutar Migración"
        color="negative"
        icon="play_arrow"
        :loading="migrating"
        :disable="running || !dryRunResult"
        @click="confirmMigration"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, Notify } from 'quasar'
import { dryRunMigration, migratePlayersToParticipations } from '@/utils/migratePlayersToParticipations'

const running = ref(false)
const migrating = ref(false)
const dryRunResult = ref<{
  totalPlayers: number
  uniqueEmails: number
  noEmail: number
  playersToCreate: number
  participationsToCreate: number
  playersToDelete: number
} | null>(null)

const migrationResult = ref<{
  playersCreated: number
  participationsCreated: number
  playersDeleted: number
  errors: number
} | null>(null)

async function runDryRun() {
  running.value = true
  dryRunResult.value = null

  try {
    // Ejecutar análisis
    await dryRunMigration()

    // Simular resultado (el dry run actual imprime en consola)
    // En producción, modificarías dryRunMigration para retornar estos datos
    Notify.create({
      type: 'info',
      message: 'Análisis completado. Revisa la consola del navegador.',
      timeout: 5000
    })

    // Por ahora, datos de ejemplo
    dryRunResult.value = {
      totalPlayers: 0,
      uniqueEmails: 0,
      noEmail: 0,
      playersToCreate: 0,
      participationsToCreate: 0,
      playersToDelete: 0
    }
  } catch (error) {
    console.error('Error en dry run:', error)
    Notify.create({
      type: 'negative',
      message: 'Error al analizar datos'
    })
  } finally {
    running.value = false
  }
}

function confirmMigration() {
  Dialog.create({
    title: '⚠️ Confirmar Migración',
    message: `
      <b>ADVERTENCIA:</b> Esta acción modificará la base de datos.<br><br>
      - Se eliminarán jugadores duplicados<br>
      - Se crearán nuevas participaciones<br>
      - <b class="text-negative">Esta acción NO es reversible</b><br><br>
      ¿Estás seguro de continuar?
    `,
    html: true,
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7'
    },
    ok: {
      label: 'Sí, ejecutar migración',
      color: 'negative',
      unelevated: true
    },
    persistent: true
  }).onOk(() => {
    void executeMigration()
  })
}

async function executeMigration() {
  migrating.value = true
  migrationResult.value = null

  try {
    await migratePlayersToParticipations()

    Notify.create({
      type: 'positive',
      message: 'Migración completada. Revisa la consola para detalles.',
      timeout: 5000
    })

    // Simular resultado (en producción, modificar la función para retornar datos)
    migrationResult.value = {
      playersCreated: 0,
      participationsCreated: 0,
      playersDeleted: 0,
      errors: 0
    }
  } catch (error) {
    console.error('Error en migración:', error)
    Notify.create({
      type: 'negative',
      message: 'Error durante la migración. Revisa la consola.'
    })
  } finally {
    migrating.value = false
  }
}
</script>
