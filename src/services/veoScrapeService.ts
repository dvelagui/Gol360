import { api } from '@/boot/axios';

export interface ScrapeJobRequest {
  matchUrl: string;
  tournamentId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  startUrl?: string;
  options?: {
    dataTypes?: string[];
    waitTimeout?: number;
    maxRetries?: number;
  };
}

export interface ScrapeJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  request: ScrapeJobRequest;
  progress?: {
    current: number;
    total: number;
    currentStep: string;
  };
  results?: {
    dataTypes: string[];
    storagePrefix: string;
  };
  error?: {
    code: string;
    message: string;
    failedAt: string;
  };
}

export interface JobsListResponse {
  jobs: Array<{
    jobId: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    matchUrl?: string;
    tournamentId?: string;
    matchId?: string;
    homeTeam?: string;
    awayTeam?: string;
    progress?: any;
  }>;
  total: number;
  limit: number;
  hasMore: boolean;
  lastJobId: string | null;
  filters: {
    status?: string;
    tournamentId?: string;
  };
}

export interface SystemStatus {
  timestamp: string;
  service: string;
  status: string;
  totalJobs: number;
  recentJobs: Array<{
    jobId: string;
    status: string;
    createdAt: string;
    matchUrl?: string;
    tournamentId?: string;
    matchId?: string;
  }>;
}

export interface AnalyticsData {
  tournament_id: string;
  match_id: string;
  teams: string[];
  processed_at?: string;
  data: {
    [dataType: string]: any[];
  };
}

class VeoScrapeService {

  async triggerScrapeJob(request: ScrapeJobRequest): Promise<{ jobId: string; status: string; message: string; estimatedCompletionTime: string; endpoints: { status: string; analytics: string } }> {
    const response = await api.post('/api/scrape/match', request);
    return response.data;
  }

  async getJobStatus(jobId: string): Promise<ScrapeJob> {
    const response = await api.get(`/api/scrape/status/${jobId}`);
    return response.data;
  }

  async listJobs(options?: {
    limit?: number;
    status?: string;
    tournamentId?: string;
    startAfter?: string;
  }): Promise<JobsListResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.tournamentId) params.append('tournamentId', options.tournamentId);
    if (options?.startAfter) params.append('startAfter', options.startAfter);

    const response = await api.get(`/api/scrape/jobs?${params.toString()}`);
    return response.data;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get('/api/scrape/status');
    return response.data;
  }

  async cancelJob(jobId: string): Promise<{ jobId: string; status: string; message: string; cancelledAt: string }> {
    const response = await api.delete(`/api/scrape/jobs/${jobId}`);
    return response.data;
  }

  async getMatchAnalytics(
    tournamentId: string,
    matchId: string,
    options?: {
      dataTypes?: string[];
      teams?: string[];
    }
  ): Promise<AnalyticsData | null> {
    const params = new URLSearchParams();
    if (options?.dataTypes) {
      options.dataTypes.forEach(type => params.append('dataTypes', type));
    }
    if (options?.teams) {
      options.teams.forEach(team => params.append('teams', team));
    }

    const response = await api.get(`/api/matches/${tournamentId}/${matchId}/analytics?${params.toString()}`);
    return response.data;
  }

  async getTeamAnalytics(
    tournamentId: string,
    matchId: string,
    teamName: string,
    dataTypes?: string[]
  ): Promise<AnalyticsData | null> {
    const params = new URLSearchParams();
    if (dataTypes) {
      dataTypes.forEach(type => params.append('dataTypes', type));
    }

    const response = await api.get(`/api/matches/${tournamentId}/${matchId}/teams/${teamName}/analytics?${params.toString()}`);
    return response.data;
  }

  async getMatchHighlights(
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
  ): Promise<{
    tournament_id: string;
    match_id: string;
    highlights: any[];
    total: number;
    filters: any;
  }> {
    const params = new URLSearchParams();
    if (options?.teams) {
      options.teams.forEach(team => params.append('teams', team));
    }
    if (options?.tags) {
      options.tags.forEach(tag => params.append('tags', tag));
    }
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.timeRange?.start !== undefined) params.append('timeStart', options.timeRange.start.toString());
    if (options?.timeRange?.end !== undefined) params.append('timeEnd', options.timeRange.end.toString());

    const response = await api.get(`/api/matches/${tournamentId}/${matchId}/highlights?${params.toString()}`);
    return response.data;
  }

  async getPlayerMoments(
    tournamentId: string,
    matchId: string,
    options?: {
      teams?: string[];
      players?: string[];
      limit?: number;
    }
  ): Promise<{
    tournament_id: string;
    match_id: string;
    player_moments: any[];
    total: number;
    filters: any;
  }> {
    const params = new URLSearchParams();
    if (options?.teams) {
      options.teams.forEach(team => params.append('teams', team));
    }
    if (options?.players) {
      options.players.forEach(player => params.append('players', player));
    }
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await api.get(`/api/matches/${tournamentId}/${matchId}/player-moments?${params.toString()}`);
    return response.data;
  }

  async debugJobStructure(): Promise<any> {
    const response = await api.get('/api/scrape/debug/job-structure');
    return response.data;
  }

  async debugScrapeRequest(request: ScrapeJobRequest): Promise<any> {
    const response = await api.post('/api/scrape/debug', request);
    return response.data;
  }
}

export default new VeoScrapeService();