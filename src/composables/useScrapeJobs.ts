import { ref, computed, onMounted, onUnmounted } from 'vue';
import veoScrapeService, { type ScrapeJob, type ScrapeJobRequest, type JobsListResponse } from '@/services/veoScrapeService';

export function useScrapeJobs() {
  const jobs = ref<ScrapeJob[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const hasMore = ref(false);
  const lastJobId = ref<string | null>(null);

  const pollingInterval = ref<NodeJS.Timeout | null>(null);
  const pollingEnabled = ref(false);

  const runningJobs = computed(() =>
    jobs.value.filter(job => job.status === 'running' || job.status === 'pending')
  );

  const completedJobs = computed(() =>
    jobs.value.filter(job => job.status === 'completed')
  );

  const failedJobs = computed(() =>
    jobs.value.filter(job => job.status === 'failed')
  );

  const isJobRunning = (jobId: string) => {
    const job = jobs.value.find(j => j.jobId === jobId);
    return job?.status === 'running' || job?.status === 'pending';
  };

  const getJobById = (jobId: string) => {
    return jobs.value.find(j => j.jobId === jobId);
  };

  async function loadJobs(options?: {
    limit?: number;
    status?: string;
    tournamentId?: string;
    append?: boolean;
  }) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.listJobs({
        limit: options?.limit || 20,
        status: options?.status,
        tournamentId: options?.tournamentId,
        startAfter: options?.append ? lastJobId.value || undefined : undefined
      });

      if (options?.append) {
        jobs.value.push(...result.jobs.map(j => ({ ...j, request: {} as ScrapeJobRequest })));
      } else {
        jobs.value = result.jobs.map(j => ({ ...j, request: {} as ScrapeJobRequest }));
      }

      hasMore.value = result.hasMore;
      lastJobId.value = result.lastJobId;

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading jobs';
      console.error('Error loading jobs:', err);
    } finally {
      loading.value = false;
    }
  }

  async function triggerScrapeJob(request: ScrapeJobRequest) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.triggerScrapeJob(request);

      // Refrescar la lista de jobs para incluir el nuevo
      await loadJobs();

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error triggering scrape job';
      console.error('Error triggering scrape job:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getJobStatus(jobId: string) {
    try {
      const job = await veoScrapeService.getJobStatus(jobId);

      // Actualizar el job en la lista local
      const index = jobs.value.findIndex(j => j.jobId === jobId);
      if (index !== -1) {
        jobs.value[index] = job;
      } else {
        jobs.value.unshift(job);
      }

      return job;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error getting job status';
      console.error('Error getting job status:', err);
      throw err;
    }
  }

  async function cancelJob(jobId: string) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.cancelJob(jobId);

      // Actualizar el job localmente
      const index = jobs.value.findIndex(j => j.jobId === jobId);
      if (index !== -1) {
        jobs.value[index].status = 'cancelled';
      }

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cancelling job';
      console.error('Error cancelling job:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function startPolling(intervalMs = 5000) {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
    }

    pollingEnabled.value = true;
    pollingInterval.value = setInterval(async () => {
      if (runningJobs.value.length > 0) {
        // Solo actualizar jobs que están corriendo
        for (const job of runningJobs.value) {
          try {
            await getJobStatus(job.jobId);
          } catch (err) {
            console.error(`Error polling job ${job.jobId}:`, err);
          }
        }
      }
    }, intervalMs);
  }

  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    pollingEnabled.value = false;
  }

  // Auto-start polling cuando hay jobs corriendo
  function autoStartPolling() {
    if (runningJobs.value.length > 0 && !pollingEnabled.value) {
      startPolling();
    } else if (runningJobs.value.length === 0 && pollingEnabled.value) {
      stopPolling();
    }
  }

  onMounted(() => {
    loadJobs();
  });

  onUnmounted(() => {
    stopPolling();
  });

  return {
    // State
    jobs,
    loading,
    error,
    hasMore,
    pollingEnabled,

    // Computed
    runningJobs,
    completedJobs,
    failedJobs,

    // Methods
    loadJobs,
    triggerScrapeJob,
    getJobStatus,
    cancelJob,
    startPolling,
    stopPolling,
    autoStartPolling,
    isJobRunning,
    getJobById
  };
}