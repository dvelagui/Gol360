import { db } from '@/boot/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { getTeam } from './teamService'

/**
 * Interface para la metadata del partido en Firestore
 * Estructura: tournaments/{tournamentId}/matches/{matchId}
 */
export interface MatchMetadata {
  id: string
  tournamentId: string
  HOME_TEAM: string  // Nombre del equipo local
  AWAY_TEAM: string  // Nombre del equipo visitante
  VIDEO_ID?: string  // ID del video de YouTube
  MATCH_START?: string  // Tiempo de inicio del partido en el video (formato: "MM:SS")
  VAR_TIME?: number  // Segundos a restar de cada timecode para sincronizar con el video
  date?: number
  status?: string
  score?: {
    home: number
    away: number
  }
}

/**
 * Obtiene la metadata del partido desde Firestore
 * Esta metadata está en el documento padre de las subcolecciones de analytics
 */
export async function getMatchMetadata(
  tournamentId: string,
  matchId: string
): Promise<MatchMetadata | null> {
  try {
    console.log('[getMatchMetadata] Fetching match:', { tournamentId, matchId })
    console.log('[getMatchMetadata] Path:', `tournaments/${tournamentId}/matches/${matchId}`)

    const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)
    const matchSnap = await getDoc(matchRef)

    if (!matchSnap.exists()) {
      console.warn(`[getMatchMetadata] Match not found: ${matchId}`)
      return null
    }

    const data = matchSnap.data()
    console.log('[getMatchMetadata] Raw document data:', data)
    console.log('[getMatchMetadata] homeTeamId type:', typeof data.homeTeamId, data.homeTeamId)
    console.log('[getMatchMetadata] awayTeamId type:', typeof data.awayTeamId, data.awayTeamId)

    return {
      id: matchSnap.id,
      ...data
    } as MatchMetadata
  } catch (error) {
    console.error('[getMatchMetadata] Error:', error)
    throw error
  }
}

/**
 * Determina si un teamId corresponde a 'home' o 'away' en el partido
 * Busca el equipo en Firestore y compara por nombre
 */
export async function determineTeamSide(
  matchMetadata: MatchMetadata,
  teamId: string
): Promise<'home' | 'away' | null> {
  try {
    console.log('[determineTeamSide] Looking up team:', teamId)

    // Buscar el equipo en Firestore para obtener su nombre
    const team = await getTeam(teamId)

    if (!team) {
      console.warn('[determineTeamSide] Team not found:', teamId)
      return null
    }

    const teamName = team.displayName
    console.log('[determineTeamSide] Team name:', teamName)
    console.log('[determineTeamSide] Match HOME_TEAM:', matchMetadata.HOME_TEAM)
    console.log('[determineTeamSide] Match AWAY_TEAM:', matchMetadata.AWAY_TEAM)

    // Comparar por nombre (case-insensitive)
    if (teamName.toLowerCase() === matchMetadata.HOME_TEAM.toLowerCase()) {
      console.log('[determineTeamSide] Team is HOME')
      return 'home'
    }

    if (teamName.toLowerCase() === matchMetadata.AWAY_TEAM.toLowerCase()) {
      console.log('[determineTeamSide] Team is AWAY')
      return 'away'
    }

    console.warn('[determineTeamSide] Team name does not match HOME or AWAY')
    return null
  } catch (error) {
    console.error('[determineTeamSide] Error:', error)
    throw error
  }
}
