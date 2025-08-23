import type { Match } from '@/types/competition'

export type StandingRow = {
  teamId: string
  teamName: string
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  yellow: number
  red: number
}

/**
 * Construye la tabla de posiciones desde la lista de partidos FINALIZADOS.
 * Tolera 'finished' (oficial) y 'terminado' (legado).
 */
export function computeStandings(
  teams: { id: string; name: string }[],
  matches: Match[]
): StandingRow[] {
  const map = new Map<string, StandingRow>()

  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      yellow: 0,
      red: 0
    })
  }

  for (const m of matches) {
    // Soporta ambos valores por si hay datos viejos
    if (m.status !== 'terminado') continue

    const homeId = typeof m.homeTeamId === 'object' ? m.homeTeamId.id : m.homeTeamId
    const awayId = typeof m.awayTeamId === 'object' ? m.awayTeamId.id : m.awayTeamId
    const h = map.get(homeId)
    const a = map.get(awayId)
    if (!h || !a) continue

    const sh = m.score?.home ?? 0
    const sa = m.score?.away ?? 0

    h.played++; a.played++
    h.goalsFor += sh; h.goalsAgainst += sa
    a.goalsFor += sa; a.goalsAgainst += sh

    if (sh > sa) { h.won++; a.lost++; h.points += 3 }
    else if (sh < sa) { a.won++; h.lost++; a.points += 3 }
    else { h.draw++; a.draw++; h.points++; a.points++ }

    h.goalDiff = h.goalsFor - h.goalsAgainst
    a.goalDiff = a.goalsFor - a.goalsAgainst
  }

  return Array.from(map.values()).sort((x, y) => {
    // Orden: puntos, DG, GF, nombre
    if (y.points !== x.points) return y.points - x.points
    if (y.goalDiff !== x.goalDiff) return y.goalDiff - x.goalDiff
    if (y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor
    return x.teamName.localeCompare(y.teamName)
  })
}

export type ScorerRow = {
  playerId: string
  playerName: string
  teamId: string
  goals: number
}

/** Tipo mínimo de evento que necesitamos para rankings/disciplinas */
export type EventLite = {
  matchId: string
  tournamentId: string
  teamId: string
  playerId: string | null
  playerName?: string
  type:
    | 'goal'
    | 'penalty_scored'
    | 'own_goal'
    | 'assist'
    | 'yellow'
    | 'red'
    | 'penalty_missed'
    | 'sub_in'
    | 'sub_out'
  minute?: number
}

/**
 * Inyecta tarjetas (amarillas/rojas) por equipo en la tabla ya calculada.
 * No muta el array original; devuelve una copia con los contadores aplicados.
 */
export function applyDisciplineFromEvents(
  rows: StandingRow[],
  events: EventLite[]
): StandingRow[] {
  // Acumula tarjetas por teamId
  const cards = new Map<string, { yellow: number; red: number }>()
  for (const ev of events) {
    if (ev.type !== 'yellow' && ev.type !== 'red') continue
    const c = cards.get(ev.teamId) ?? { yellow: 0, red: 0 }
    if (ev.type === 'yellow') c.yellow += 1
    if (ev.type === 'red') c.red += 1
    cards.set(ev.teamId, c)
  }

  // Aplica a las filas
  return rows.map(r => {
    const c = cards.get(r.teamId)
    return c ? { ...r, yellow: c.yellow, red: c.red } : r
  })
}

/**
 * Ranking de goleadores a partir de eventos.
 * Cuenta 'goal' y 'penalty_scored'. Ignora 'own_goal' y requiere playerId.
 */
export function computeTopScorers(
  events: EventLite[],
  limit = 10
): ScorerRow[] {
  const goals = new Map<string, ScorerRow>()

  for (const ev of events) {
    if (ev.type !== 'goal' && ev.type !== 'penalty_scored') continue
    if (!ev.playerId) continue

    const current = goals.get(ev.playerId) ?? {
      playerId: ev.playerId,
      playerName: ev.playerName ?? 'Jugador',
      teamId: ev.teamId,
      goals: 0
    }
    current.goals += 1
    goals.set(ev.playerId, current)
  }

  return Array.from(goals.values())
    .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))
    .slice(0, limit)
}
