import { ref, computed } from 'vue';
import veoScrapeService, { type AnalyticsData } from '@/services/veoScrapeService';

export function useMatchAnalytics() {
  const analytics = ref<AnalyticsData | null>(null);
  const teamAnalytics = ref<Record<string, AnalyticsData | null>>({});
  const highlights = ref<unknown[]>([]);
  const playerMoments = ref<unknown[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const availableDataTypes = computed(() => {
    if (!analytics.value) return [];
    return Object.keys(analytics.value.data);
  });

  const hasData = computed(() => {
    return analytics.value !== null && Object.keys(analytics.value.data).length > 0;
  });

  const teams = computed(() => {
    return analytics.value?.teams || [];
  });

  async function loadMatchAnalytics(
    tournamentId: string,
    matchId: string,
    options?: {
      dataTypes?: string[];
      teams?: string[];
    }
  ) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.getMatchAnalytics(tournamentId, matchId, options);
      analytics.value = result;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading match analytics';
      console.error('Error loading match analytics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadTeamAnalytics(
    tournamentId: string,
    matchId: string,
    teamName: string,
    dataTypes?: string[]
  ) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.getTeamAnalytics(tournamentId, matchId, teamName, dataTypes);
      teamAnalytics.value[teamName] = result;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading team analytics';
      console.error('Error loading team analytics:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadMatchHighlights(
    tournamentId: string,
    matchId: string,
    options?: {
      teams?: string[];
      tags?: string[];
      limit?: number;
      timeRange?: {
        start?: number;
        end?: number;
      };
    }
  ) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.getMatchHighlights(tournamentId, matchId, options);
      highlights.value = result.highlights;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading match highlights';
      console.error('Error loading match highlights:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadPlayerMoments(
    tournamentId: string,
    matchId: string,
    options?: {
      teams?: string[];
      players?: string[];
      limit?: number;
    }
  ) {
    try {
      loading.value = true;
      error.value = null;

      const result = await veoScrapeService.getPlayerMoments(tournamentId, matchId, options);
      playerMoments.value = result.player_moments;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading player moments';
      console.error('Error loading player moments:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function getDataByType(dataType: string) {
    return analytics.value?.data[dataType] || [];
  }

  function getTeamData(teamName: string, dataType?: string) {
    const teamData = teamAnalytics.value[teamName];
    if (!teamData) return [];

    if (dataType) {
      return teamData.data[dataType] || [];
    }

    return teamData.data;
  }

  function clearData() {
    analytics.value = null;
    teamAnalytics.value = {};
    highlights.value = [];
    playerMoments.value = [];
    error.value = null;
  }

  return {
    // State
    analytics,
    teamAnalytics,
    highlights,
    playerMoments,
    loading,
    error,

    // Computed
    availableDataTypes,
    hasData,
    teams,

    // Methods
    loadMatchAnalytics,
    loadTeamAnalytics,
    loadMatchHighlights,
    loadPlayerMoments,
    getDataByType,
    getTeamData,
    clearData
  };
}
