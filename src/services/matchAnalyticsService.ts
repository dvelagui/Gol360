import { db } from '@/boot/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore'

export interface MatchStats {
  team: string
  stats: Array<{
    name: string
    home: string | number
    away: string | number
  }>
  updatedAt: Date
}

export interface LocationMapData {
  defensive_passes: string
  middle_passes: string
  attacking_passes: string
  defensive_possession: string
  middle_possession: string
  attacking_possession: string
}

export interface ShotMapPeriod {
  period: string
  goals: string
  shots: string
  total: string
  insideBox: string
  outsideBox: string
  conversionRate: string
  screenshot?: string
}

export interface ShotMapData {
  team: string
  data: Record<string, ShotMapPeriod> // Por período: "Full recording", "1st period", "2nd period"
  updatedAt: Date
}

export interface HeatMapPeriod {
  period: string
  screenshot?: string
}

export interface HeatMapData {
  team: string
  data: Record<string, HeatMapPeriod> // Por período
  updatedAt: Date
}

export interface PassesStringsPeriod {
  xAxisLabels: string[]
  bars: number[]
  stat_3to5: string
  stat_6ormore: string
  stat_longest: string
}

export interface PassesStringsData {
  team: string
  data: Record<string, PassesStringsPeriod> // Por período
  updatedAt: Date
}

export interface PlayerMoment {
  team: string
  side: 'home' | 'away'
  playerName: string
  moments: Array<{
    startTime: string
    duration: string
    trackingStart?: number
    trackingEnd?: number
    name?: string
  }>
  totalMoments: number
  updatedAt: Date
}

export interface Highlight {
  team: string
  side: 'home' | 'away'
  team_name: string
  index: number
  tag: string
  timecode: string
  json: string
  updatedAt: Date
}

/**
 * Obtiene las estadísticas de un partido (home o away)
 */
export async function getMatchStats(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<MatchStats | null> {
  try {
    const statsRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'stats',
      side
    )

    const statsSnap = await getDoc(statsRef)

    if (!statsSnap.exists()) {
      return null
    }

    const data = statsSnap.data()
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as MatchStats
  } catch (error) {
    console.error('[getMatchStats] Error:', error)
    throw error
  }
}

/**
 * Obtiene shot map de un partido (home o away)
 */
export async function getShotMap(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<ShotMapData | null> {
  try {
    const shotMapRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'shotMaps',
      side
    )

    const shotMapSnap = await getDoc(shotMapRef)

    if (!shotMapSnap.exists()) {
      return null
    }

    const data = shotMapSnap.data()
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as ShotMapData
  } catch (error) {
    console.error('[getShotMap] Error:', error)
    throw error
  }
}

/**
 * Obtiene heat map de un partido (home o away)
 */
export async function getHeatMap(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<HeatMapData | null> {
  try {
    const heatMapRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'heatMaps',
      side
    )

    const heatMapSnap = await getDoc(heatMapRef)

    if (!heatMapSnap.exists()) {
      return null
    }

    const data = heatMapSnap.data()
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as HeatMapData
  } catch (error) {
    console.error('[getHeatMap] Error:', error)
    throw error
  }
}

/**
 * Obtiene location map de un partido (home o away)
 */
export async function getLocationMap(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<Record<string, LocationMapData> | null> {
  try {
    const locationMapRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'locationMaps',
      side
    )

    const locationMapSnap = await getDoc(locationMapRef)

    if (!locationMapSnap.exists()) {
      return null
    }

    return locationMapSnap.data().data as Record<string, LocationMapData>
  } catch (error) {
    console.error('[getLocationMap] Error:', error)
    throw error
  }
}

/**
 * Obtiene passes strings de un partido (home o away)
 */
export async function getPassesStrings(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<PassesStringsData | null> {
  try {
    const passesRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'passesStrings',
      side
    )

    const passesSnap = await getDoc(passesRef)

    if (!passesSnap.exists()) {
      return null
    }

    const data = passesSnap.data()
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as PassesStringsData
  } catch (error) {
    console.error('[getPassesStrings] Error:', error)
    throw error
  }
}

/**
 * Obtiene todos los player moments de un partido
 */
export async function getPlayerMoments(
  tournamentId: string,
  matchId: string,
  side?: 'home' | 'away'
): Promise<PlayerMoment[]> {
  try {
    const momentsCol = collection(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'playerMoments'
    )

    let q = query(momentsCol)

    if (side) {
      q = query(momentsCol, where('side', '==', side))
    }

    const momentsSnap = await getDocs(q)

    return momentsSnap.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as PlayerMoment
    })
  } catch (error) {
    console.error('[getPlayerMoments] Error:', error)
    throw error
  }
}

/**
 * Obtiene todos los highlights de un partido
 */
export async function getHighlights(
  tournamentId: string,
  matchId: string,
  side?: 'home' | 'away'
): Promise<Highlight[]> {
  try {
    const highlightsCol = collection(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'highlights'
    )

    let q = query(highlightsCol)

    if (side) {
      q = query(highlightsCol, where('side', '==', side))
    }

    const highlightsSnap = await getDocs(q)

    return highlightsSnap.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Highlight
    })
  } catch (error) {
    console.error('[getHighlights] Error:', error)
    throw error
  }
}

/**
 * Obtiene todos los datos de analytics de un partido por equipo
 */
export async function getTeamAnalytics(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
) {
  try {
    const [stats, shotMap, heatMap, locationMap, passesStrings] = await Promise.all([
      getMatchStats(tournamentId, matchId, side),
      getShotMap(tournamentId, matchId, side),
      getHeatMap(tournamentId, matchId, side),
      getLocationMap(tournamentId, matchId, side),
      getPassesStrings(tournamentId, matchId, side)
    ])

    return {
      stats,
      shotMap,
      heatMap,
      locationMap,
      passesStrings
    }
  } catch (error) {
    console.error('[getTeamAnalytics] Error:', error)
    throw error
  }
}

/**
 * Obtiene todos los datos de analytics de un partido (ambos equipos)
 */
export async function getAllMatchAnalytics(
  tournamentId: string,
  matchId: string
) {
  try {
    console.log(`[getAllMatchAnalytics] Fetching data for tournament=${tournamentId}, match=${matchId}`)

    const [homeData, awayData, playerMoments, highlights] = await Promise.all([
      getTeamAnalytics(tournamentId, matchId, 'home'),
      getTeamAnalytics(tournamentId, matchId, 'away'),
      getPlayerMoments(tournamentId, matchId),
      getHighlights(tournamentId, matchId)
    ])

    console.log('[getAllMatchAnalytics] Data fetched successfully:', {
      homeData: homeData ? 'Found' : 'Not found',
      awayData: awayData ? 'Found' : 'Not found',
      playerMomentsCount: playerMoments.length,
      highlightsCount: highlights.length
    })

    return {
      home: homeData,
      away: awayData,
      playerMoments,
      highlights
    }
  } catch (error) {
    console.error('[getAllMatchAnalytics] Error:', error)
    throw error
  }
}
