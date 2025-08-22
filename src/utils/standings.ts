// src/utils/standings.ts
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

export function computeStandings(
  teams: { id: string; name: string }[],
  matches: Match[]
): StandingRow[] {
  const map = new Map<string, StandingRow>()
  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0, won: 0, draw: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
      yellow: 0, red: 0
    })
  }

  for (const m of matches) {
    if (m.status !== 'terminado') continue
    const h = map.get(typeof m.homeTeamId === 'object' ? m.homeTeamId.id : m.homeTeamId)
    const a = map.get(typeof m.awayTeamId === 'object' ? m.awayTeamId.id : m.awayTeamId)
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

export type ScorerRow = { playerId: string; playerName: string; teamId: string; goals: number }
