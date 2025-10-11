import { api } from '@/boot/axios'
import type { AnalyticsResponse } from '@/types/analytics'

/**
 * Servicio para obtener analytics de partidos desde la API de GOL360
 */
class AnalyticsService {
  /**
   * Obtiene los analytics de un partido específico
   * @param tournamentId - ID del torneo (ej: "VeteranosTunja2025")
   * @param matchId - ID del partido (ej: "LibVsColo")
   * @returns Datos de analytics con heatmaps, highlights, passNetwork, etc.
   */
  async getMatchAnalytics(
    tournamentId: string,
    matchId: string
  ): Promise<AnalyticsResponse> {
    const url = `/gol360-api/api/matches/${tournamentId}/${matchId}/analytics`
    const response = await api.get<AnalyticsResponse>(url)
    return response.data
  }

  /**
   * Obtiene solo los highlights de un partido
   * @param tournamentId - ID del torneo
   * @param matchId - ID del partido
   * @returns Array de highlights por equipo
   */
  async getMatchHighlights(tournamentId: string, matchId: string) {
    const data = await this.getMatchAnalytics(tournamentId, matchId)
    return data.data.highlights || []
  }

  /**
   * Obtiene solo los heatmaps de un partido
   * @param tournamentId - ID del torneo
   * @param matchId - ID del partido
   * @returns Array de heatmaps por equipo y período
   */
  async getMatchHeatMaps(tournamentId: string, matchId: string) {
    const data = await this.getMatchAnalytics(tournamentId, matchId)
    return data.data.heatMap || []
  }

  /**
   * Obtiene solo las redes de pases de un partido
   * @param tournamentId - ID del torneo
   * @param matchId - ID del partido
   * @returns Array de pass networks por equipo
   */
  async getMatchPassNetworks(tournamentId: string, matchId: string) {
    const data = await this.getMatchAnalytics(tournamentId, matchId)
    return data.data.passNetwork || []
  }

  /**
   * Obtiene solo las estadísticas de jugadores de un partido
   * @param tournamentId - ID del torneo
   * @param matchId - ID del partido
   * @returns Array de estadísticas de jugadores por equipo
   */
  async getMatchPlayerStats(tournamentId: string, matchId: string) {
    const data = await this.getMatchAnalytics(tournamentId, matchId)
    return data.data.playerStats || []
  }
}

export default new AnalyticsService()
