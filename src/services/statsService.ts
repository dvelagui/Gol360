/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/statsService.ts
import { db } from '@/boot/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import type { MatchEvent } from '@/types/competition'

const eventsCol = collection(db, 'matchEvents')

export interface PlayerStats {
  playerId: string
  playerName: string
  goals: number
  matches: number
  yellow: number
  red: number
  blue: number
  fouls: number
  assists: number
}

/**
 * Calcula las estadísticas de todos los jugadores de un equipo basado en eventos aprobados
 */
export async function getPlayerStatsByTeam(teamId: string): Promise<PlayerStats[]> {
  // Obtener todos los eventos aprobados del equipo
  const q = query(
    eventsCol,
    where('teamId.id', '==', teamId),
    where('status', '==', 'aprobado')
  )

  const snap = await getDocs(q)
  const events = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MatchEvent[]

  // Agrupar eventos por jugador
  const statsMap = new Map<string, PlayerStats>()

  for (const event of events) {
    if (!event.playerId?.id) continue // Saltar eventos sin jugador

    const playerId = event.playerId.id
    const playerName = event.playerId.name || 'Jugador'

    // Inicializar stats si no existen
    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, {
        playerId,
        playerName,
        goals: 0,
        matches: 0,
        yellow: 0,
        red: 0,
        blue: 0,
        fouls: 0,
        assists: 0
      })
    }

    const stats = statsMap.get(playerId)!

    // Contar eventos por tipo
    switch (event.type) {
      case 'gol':
      case 'penalti_marcado':
        stats.goals++
        break
      case 'autogol':
        // Los autogoles NO se cuentan para el jugador que lo hizo
        break
      case 'asistencia':
        stats.assists++
        break
      case 'amarilla':
        stats.yellow++
        break
      case 'roja':
        stats.red++
        break
      // Nota: 'blue' parece ser una tarjeta azul (no está en EventType actual)
      // case 'azul':
      //   stats.blue++
      //   break
    }
  }

  // Calcular partidos jugados (eventos únicos por matchId)
  const matchesByPlayer = new Map<string, Set<string>>()

  for (const event of events) {
    if (!event.playerId?.id) continue

    const playerId = event.playerId.id
    if (!matchesByPlayer.has(playerId)) {
      matchesByPlayer.set(playerId, new Set())
    }
    matchesByPlayer.get(playerId)!.add(event.matchId)
  }

  // Asignar número de partidos
  for (const [playerId, matches] of matchesByPlayer.entries()) {
    const stats = statsMap.get(playerId)
    if (stats) {
      stats.matches = matches.size
    }
  }

  return Array.from(statsMap.values())
}

/**
 * Calcula las estadísticas de todos los jugadores de un torneo basado en eventos aprobados
 */
export async function getPlayerStatsByTournament(tournamentId: string): Promise<PlayerStats[]> {
  // Obtener todos los eventos aprobados del torneo
  const q = query(
    eventsCol,
    where('tournamentId', '==', tournamentId),
    where('status', '==', 'aprobado')
  )

  const snap = await getDocs(q)
  const events = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MatchEvent[]

  // Agrupar eventos por jugador
  const statsMap = new Map<string, PlayerStats>()

  for (const event of events) {
    if (!event.playerId?.id) continue

    const playerId = event.playerId.id
    const playerName = event.playerId.name || 'Jugador'

    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, {
        playerId,
        playerName,
        goals: 0,
        matches: 0,
        yellow: 0,
        red: 0,
        blue: 0,
        fouls: 0,
        assists: 0
      })
    }

    const stats = statsMap.get(playerId)!

    switch (event.type) {
      case 'gol':
      case 'penalti_marcado':
        stats.goals++
        break
      case 'asistencia':
        stats.assists++
        break
      case 'amarilla':
        stats.yellow++
        break
      case 'roja':
        stats.red++
        break
    }
  }

  // Calcular partidos jugados
  const matchesByPlayer = new Map<string, Set<string>>()

  for (const event of events) {
    if (!event.playerId?.id) continue

    const playerId = event.playerId.id
    if (!matchesByPlayer.has(playerId)) {
      matchesByPlayer.set(playerId, new Set())
    }
    matchesByPlayer.get(playerId)!.add(event.matchId)
  }

  for (const [playerId, matches] of matchesByPlayer.entries()) {
    const stats = statsMap.get(playerId)
    if (stats) {
      stats.matches = matches.size
    }
  }

  return Array.from(statsMap.values())
}

/**
 * Obtiene estadísticas de un jugador específico
 */
export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const q = query(
    eventsCol,
    where('playerId.id', '==', playerId),
    where('status', '==', 'aprobado')
  )

  const snap = await getDocs(q)
  const events = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MatchEvent[]

  if (events.length === 0) return null

  const stats: PlayerStats = {
    playerId,
    playerName: events[0]?.playerId?.name || 'Jugador',
    goals: 0,
    matches: 0,
    yellow: 0,
    red: 0,
    blue: 0,
    fouls: 0,
    assists: 0
  }

  for (const event of events) {
    switch (event.type) {
      case 'gol':
      case 'penalti_marcado':
        stats.goals++
        break
      case 'asistencia':
        stats.assists++
        break
      case 'amarilla':
        stats.yellow++
        break
      case 'roja':
        stats.red++
        break
    }
  }

  // Calcular partidos únicos
  const uniqueMatches = new Set(events.map(e => e.matchId))
  stats.matches = uniqueMatches.size

  return stats
}
