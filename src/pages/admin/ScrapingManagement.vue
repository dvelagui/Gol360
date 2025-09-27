<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <q-card>
        <q-card-section>
          <div class="text-h5 q-mb-md">Gestión de Scraping Veo.co</div>
          <p class="text-body2 text-grey-7">
            Administra los trabajos de scraping de datos de partidos desde Veo.co
          </p>
        </q-card-section>
      </q-card>
    </div>

    <!-- Nuevo Job Form -->
    <div class="q-mb-lg">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Crear Nuevo Trabajo de Scraping</div>

          <q-form @submit="onSubmitScrapeJob" class="q-gutter-md">
            <div class="row q-gutter-md">
              <div class="col-12 col-md-5">
                <q-input
                  v-model="newJob.matchUrl"
                  label="URL del Partido en Veo.co"
                  placeholder="https://app.veo.co/matches/..."
                  outlined
                  dense
                  :rules="[val => !!val || 'URL requerida']"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="newJob.tournamentId"
                  label="ID del Torneo"
                  placeholder="tournament_123"
                  outlined
                  dense
                  :rules="[val => !!val || 'ID del torneo requerido']"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="newJob.matchId"
                  label="ID del Partido"
                  placeholder="match_456"
                  outlined
                  dense
                  :rules="[val => !!val || 'ID del partido requerido']"
                />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div class="col-12 col-md-5">
                <q-input
                  v-model="newJob.homeTeam"
                  label="Equipo Local"
                  placeholder="Equipo A"
                  outlined
                  dense
                  :rules="[val => !!val || 'Equipo local requerido']"
                />
              </div>

              <div class="col-12 col-md-5">
                <q-input
                  v-model="newJob.awayTeam"
                  label="Equipo Visitante"
                  placeholder="Equipo B"
                  outlined
                  dense
                  :rules="[val => !!val || 'Equipo visitante requerido']"
                />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="newJob.startUrl"
                  label="URL de Inicio (opcional)"
                  placeholder="https://app.veo.co/teams/..."
                  outlined
                  dense
                />
              </div>

              <div class="col-12 col-md-5">
                <q-select
                  v-model="newJob.dataTypes"
                  :options="dataTypeOptions"
                  label="Tipos de Datos a Extraer"
                  multiple
                  outlined
                  dense
                  use-chips
                />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div class="col-auto">
                <q-btn
                  type="submit"
                  color="primary"
                  icon="play_arrow"
                  label="Iniciar Scraping"
                  :loading="loading"
                  :disable="!isFormValid"
                />
              </div>

              <div class="col-auto">
                <q-btn
                  color="secondary"
                  icon="bug_report"
                  label="Debug"
                  outline
                  @click="onDebugRequest"
                  :loading="loading"
                  :disable="!isFormValid"
                />
              </div>

              <div class="col-auto">
                <q-btn
                  color="negative"
                  icon="clear"
                  label="Limpiar"
                  flat
                  @click="clearForm"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>

    <!-- Jobs List -->
    <div class="q-mb-lg">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Trabajos de Scraping</div>
            <div class="row q-gutter-sm">
              <q-btn
                color="primary"
                icon="refresh"
                label="Actualizar"
                size="sm"
                @click="refreshJobs"
                :loading="loading"
              />
              <q-btn
                :color="pollingEnabled ? 'negative' : 'positive'"
                :icon="pollingEnabled ? 'pause' : 'play_arrow'"
                :label="pollingEnabled ? 'Detener Polling' : 'Iniciar Polling'"
                size="sm"
                @click="togglePolling"
              />
            </div>
          </div>

          <!-- Filtros -->
          <div class="row q-gutter-md q-mb-md">
            <div class="col-auto">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                label="Filtrar por Estado"
                outlined
                dense
                clearable
                @update:model-value="applyFilters"
              />
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="row q-gutter-md q-mb-md">
            <div class="col-auto">
              <q-card flat bordered class="q-pa-sm">
                <div class="text-subtitle2 text-grey-7">En Ejecución</div>
                <div class="text-h6 text-primary">{{ runningJobs.length }}</div>
              </q-card>
            </div>
            <div class="col-auto">
              <q-card flat bordered class="q-pa-sm">
                <div class="text-subtitle2 text-grey-7">Completados</div>
                <div class="text-h6 text-positive">{{ completedJobs.length }}</div>
              </q-card>
            </div>
            <div class="col-auto">
              <q-card flat bordered class="q-pa-sm">
                <div class="text-subtitle2 text-grey-7">Fallidos</div>
                <div class="text-h6 text-negative">{{ failedJobs.length }}</div>
              </q-card>
            </div>
          </div>

          <!-- Jobs Table -->
          <q-table
            :rows="jobs"
            :columns="jobColumns"
            row-key="jobId"
            :loading="loading"
            :pagination="{ rowsPerPage: 10 }"
            class="jobs-table"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  :color="getStatusColor(props.value)"
                  text-color="white"
                  size="sm"
                  :icon="getStatusIcon(props.value)"
                >
                  {{ props.value }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-progress="props">
              <q-td :props="props">
                <div v-if="props.row.progress" class="progress-container">
                  <q-linear-progress
                    :value="props.row.progress.current / props.row.progress.total"
                    color="primary"
                    size="8px"
                    class="q-mb-xs"
                  />
                  <div class="text-caption">
                    {{ props.row.progress.currentStep }} ({{ props.row.progress.current }}/{{ props.row.progress.total }})
                  </div>
                </div>
                <span v-else class="text-grey-5">-</span>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="q-gutter-xs">
                  <q-btn
                    color="primary"
                    icon="refresh"
                    size="sm"
                    round
                    flat
                    @click="refreshJobStatus(props.row.jobId)"
                    :loading="loading"
                  >
                    <q-tooltip>Actualizar Estado</q-tooltip>
                  </q-btn>

                  <q-btn
                    v-if="isJobRunning(props.row.jobId)"
                    color="negative"
                    icon="stop"
                    size="sm"
                    round
                    flat
                    @click="cancelJob(props.row.jobId)"
                  >
                    <q-tooltip>Cancelar Job</q-tooltip>
                  </q-btn>

                  <q-btn
                    v-if="props.row.status === 'completed'"
                    color="secondary"
                    icon="analytics"
                    size="sm"
                    round
                    flat
                    @click="viewAnalytics(props.row)"
                  >
                    <q-tooltip>Ver Analytics</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>

          <!-- Load More -->
          <div v-if="hasMore" class="text-center q-mt-md">
            <q-btn
              color="primary"
              label="Cargar Más"
              outline
              @click="loadMoreJobs"
              :loading="loading"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useScrapeJobs } from '@/composables/useScrapeJobs';
import type { ScrapeJobRequest } from '@/services/veoScrapeService';

const $q = useQuasar();

const {
  jobs,
  loading,
  error,
  hasMore,
  pollingEnabled,
  runningJobs,
  completedJobs,
  failedJobs,
  loadJobs,
  triggerScrapeJob,
  getJobStatus,
  cancelJob: cancelJobAction,
  startPolling,
  stopPolling,
  isJobRunning
} = useScrapeJobs();

// Form data
const newJob = ref<ScrapeJobRequest>({
  matchUrl: '',
  tournamentId: '',
  matchId: '',
  homeTeam: '',
  awayTeam: '',
  startUrl: '',
  options: {
    dataTypes: ['stats', 'highlights', 'player-moments']
  }
});

const dataTypeOptions = [
  { label: 'Estadísticas', value: 'stats' },
  { label: 'Highlights', value: 'highlights' },
  { label: 'Momentos de Jugadores', value: 'player-moments' },
  { label: 'Analytics', value: 'analytics' }
];

const statusFilter = ref<string | null>(null);
const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En Ejecución', value: 'running' },
  { label: 'Completado', value: 'completed' },
  { label: 'Fallido', value: 'failed' },
  { label: 'Cancelado', value: 'cancelled' }
];

const jobColumns = [
  {
    name: 'jobId',
    label: 'Job ID',
    field: 'jobId',
    align: 'left',
    sortable: true,
    format: (val: string) => val.substring(0, 20) + '...'
  },
  {
    name: 'status',
    label: 'Estado',
    field: 'status',
    align: 'center',
    sortable: true
  },
  {
    name: 'match',
    label: 'Partido',
    field: (row: any) => `${row.homeTeam || row.request?.homeTeam || 'N/A'} vs ${row.awayTeam || row.request?.awayTeam || 'N/A'}`,
    align: 'left',
    sortable: false
  },
  {
    name: 'tournament',
    label: 'Torneo',
    field: (row: any) => row.tournamentId || row.request?.tournamentId || 'N/A',
    align: 'left',
    sortable: true
  },
  {
    name: 'progress',
    label: 'Progreso',
    field: 'progress',
    align: 'center',
    sortable: false
  },
  {
    name: 'createdAt',
    label: 'Creado',
    field: 'createdAt',
    align: 'center',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleString()
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: '',
    align: 'center',
    sortable: false
  }
];

const isFormValid = computed(() => {
  return !!(newJob.value.matchUrl &&
    newJob.value.tournamentId &&
    newJob.value.matchId &&
    newJob.value.homeTeam &&
    newJob.value.awayTeam);
});

// Assign dataTypes from selection
const dataTypes = computed({
  get: () => newJob.value.options?.dataTypes || [],
  set: (val) => {
    if (!newJob.value.options) newJob.value.options = {};
    newJob.value.options.dataTypes = val;
  }
});

async function onSubmitScrapeJob() {
  try {
    const result = await triggerScrapeJob(newJob.value);

    $q.notify({
      type: 'positive',
      message: `Job iniciado: ${result.jobId}`,
      caption: result.message,
      position: 'top'
    });

    clearForm();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Error al iniciar el scraping',
      caption: err instanceof Error ? err.message : 'Error desconocido',
      position: 'top'
    });
  }
}

async function onDebugRequest() {
  try {
    const response = await fetch('/api/scrape/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob.value)
    });

    const result = await response.json();

    $q.dialog({
      title: 'Debug Results',
      message: JSON.stringify(result, null, 2),
      ok: true,
      class: 'debug-dialog'
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Error en debug',
      caption: err instanceof Error ? err.message : 'Error desconocido'
    });
  }
}

function clearForm() {
  newJob.value = {
    matchUrl: '',
    tournamentId: '',
    matchId: '',
    homeTeam: '',
    awayTeam: '',
    startUrl: '',
    options: {
      dataTypes: ['stats', 'highlights', 'player-moments']
    }
  };
}

async function refreshJobs() {
  await loadJobs();
}

async function loadMoreJobs() {
  await loadJobs({ append: true });
}

async function refreshJobStatus(jobId: string) {
  try {
    await getJobStatus(jobId);
    $q.notify({
      type: 'info',
      message: 'Estado actualizado',
      position: 'top'
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Error al actualizar estado'
    });
  }
}

async function cancelJob(jobId: string) {
  $q.dialog({
    title: 'Confirmar Cancelación',
    message: '¿Estás seguro de que quieres cancelar este job?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await cancelJobAction(jobId);
      $q.notify({
        type: 'positive',
        message: 'Job cancelado exitosamente'
      });
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: 'Error al cancelar job'
      });
    }
  });
}

function viewAnalytics(job: any) {
  const tournamentId = job.tournamentId || job.request?.tournamentId;
  const matchId = job.matchId || job.request?.matchId;

  if (tournamentId && matchId) {
    // TODO: Navigate to analytics page
    $q.notify({
      type: 'info',
      message: `Ver analytics para: ${tournamentId}/${matchId}`,
      position: 'top'
    });
  }
}

function applyFilters() {
  loadJobs({
    status: statusFilter.value || undefined
  });
}

function togglePolling() {
  if (pollingEnabled.value) {
    stopPolling();
  } else {
    startPolling();
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'orange',
    running: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'grey'
  };
  return colors[status] || 'grey';
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    pending: 'schedule',
    running: 'play_arrow',
    completed: 'check_circle',
    failed: 'error',
    cancelled: 'cancel'
  };
  return icons[status] || 'help';
}

onMounted(() => {
  // Auto-start polling if there are running jobs
  if (runningJobs.value.length > 0) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.jobs-table {
  min-height: 300px;
}

.progress-container {
  min-width: 120px;
}

.debug-dialog {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
}
</style>