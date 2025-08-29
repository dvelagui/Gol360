/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Match } from '@/types/competition'

/** Fila de la tabla de posiciones */
export type StandingRow = {
  teamId: string
  teamName: string
  group?: string
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

/** Considera ambos estados “finished” (en inglés) y “terminado” (en español) */
function isFinished(m: Match): boolean {
  const s = String(m.status || '').toLowerCase()
  return s === 'finished' || s === 'terminado'
}

/** Extrae teamId (acepta string o { id, name }) */
export function getTeamId(t: unknown): string {
  if (typeof t === 'string') return t
  if (t && typeof t === 'object' && 'id' in t) return (t as any).id as string
  return ''
}

/** Extrae teamName si estuviera en el match (cuando guardamos { id, name }) */
export function getTeamNameFromMatch(t: unknown): string | undefined {
  if (t && typeof t === 'object' && 'name' in (t as any)) {
    return (t as any).name as string
  }
  return undefined
}

/** Etiqueta de la ronda en eliminatoria */
export function knockoutRoundLabel(numPairs: number): string {
  // 16: Dieciseisavos, 8: Octavos, 4: Cuartos, 2: Semifinal, 1: Final
  if (numPairs >= 16) return 'Dieciseisavos'
  if (numPairs === 8) return 'Octavos'
  if (numPairs === 4) return 'Cuartos'
  if (numPairs === 2) return 'Semifinal'
  return 'Final'
}

/**
 * Tabla general (sin grupos). Usa lista de equipos (id/name) para nombrar correctamente.
 * También sirve de base para sacar “seeds”.
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
      played: 0, won: 0, draw: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
      yellow: 0, red: 0
    })
  }

  for (const m of matches) {
    if (!isFinished(m)) continue

    const homeId = getTeamId(m.homeTeamId as string | { id: string; name?: string })
    const awayId = getTeamId(m.awayTeamId as string | { id: string; name?: string })
    const home = map.get(homeId)
    const away = map.get(awayId)
    if (!home || !away) continue

    const sh = m.score?.home ?? 0
    const sa = m.score?.away ?? 0

    home.played++; away.played++
    home.goalsFor += sh; home.goalsAgainst += sa
    away.goalsFor += sa; away.goalsAgainst += sh

    if (sh > sa) { home.won++; away.lost++; home.points += 3 }
    else if (sh < sa) { away.won++; home.lost++; away.points += 3 }
    else { home.draw++; away.draw++; home.points++; away.points++ }

    home.goalDiff = home.goalsFor - home.goalsAgainst
    away.goalDiff = away.goalsFor - away.goalsAgainst
  }

  // Orden: puntos, DG, GF, nombre
  return Array.from(map.values()).sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points
    if (y.goalDiff !== x.goalDiff) return y.goalDiff - x.goalDiff
    if (y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor
    return x.teamName.localeCompare(y.teamName)
  })
}

/**
 * Tabla por grupos.
 * Toma las coincidencias de m.group (si existen) para clasificar.
 * Si no hay `group` en los partidos, devuelve un único grupo "A" con la tabla general.
 */
export function computeStandingsByGroup(
  teams: { id: string; name: string }[],
  matches: Match[]
): Record<string, StandingRow[]> {
  // Detectar grupos usados en los partidos finalizados
  const finished = matches.filter(isFinished)
  const groupsUsed = new Set<string>()
  for (const m of finished) {
    if (typeof (m as any).group === 'string' && (m as any).group.trim()) {
      groupsUsed.add((m as any).group.trim())
    }
  }

  // Si no hay grupos en los partidos, devolvemos A = tabla general
  if (groupsUsed.size === 0) {
    return { A: computeStandings(teams, matches) }
  }

  // Mapeamos por grupo
  const byGroup: Record<string, StandingRow[]> = {}
  for (const g of groupsUsed) {
    // equipos que aparecen en ese grupo (por si se guardan con {id,name})
    const teamIdsInGroup = new Set<string>()
    for (const m of finished) {
      if ((m as any).group !== g) continue
      teamIdsInGroup.add(getTeamId(m.homeTeamId as any))
      teamIdsInGroup.add(getTeamId(m.awayTeamId as any))
    }
    const teamsInGroup = teams.filter(t => teamIdsInGroup.has(t.id))
    const rows = computeStandings(teamsInGroup, finished.filter(m => (m as any).group === g))
    // añade etiqueta group en cada fila
    byGroup[g] = rows.map(r => ({ ...r, group: g }))
  }
  return byGroup
}

/** Helper para “seeding” general: top N de la tabla */
export function topNFromTable(table: StandingRow[], n: number): StandingRow[] {
  return table.slice(0, Math.max(0, n))
}

/** Helper para “seeding” por grupos: top N de cada grupo */
export function topNEachGroup(
  grouped: Record<string, StandingRow[]>,
  n: number
): Record<string, StandingRow[]> {
  const out: Record<string, StandingRow[]> = {}
  for (const g of Object.keys(grouped).sort()) {
    out[g] = grouped[g]!.slice(0, Math.max(0, n))
  }
  return out
}

/** Cruce A1–B2, B1–A2, etc. (dos grupos) o aleatorio mezclado */
export function buildCrossPairsFromGroups(
  groupedTop: Record<string, StandingRow[]>,
  mode: 'seeded' | 'random' = 'seeded'
): Array<[StandingRow, StandingRow]> {
  const groups = Object.keys(groupedTop).sort()
  if (groups.length < 2) {
    // con 1 grupo, no hay “cruce por grupos”
    const all = groups.length === 1 ? groupedTop[groups[0]!] : []
    return buildPairsFromList(all ?? [], mode)
  }
  if (groups.length > 2) {
    // con >2 grupos, una opción simple es intercalar por índice (1º de cada grupo, luego 2º…) y emparejar
    const flat: StandingRow[] = []
    const maxLen = Math.max(...groups.map(g => groupedTop[g]!.length))
    for (let i = 0; i < maxLen; i++) {
      for (const g of groups) {
        const r = groupedTop[g]![i]
        if (r) flat.push(r)
      }
    }
    return buildPairsFromList(flat, mode)
  }

  // Exactamente 2 grupos
  const A = groupedTop[groups[0]!] || []
  const B = groupedTop[groups[1]!] || []
  const pairs: Array<[StandingRow, StandingRow]> = []

  if (mode === 'random') {
    // Mezcla y empareja simple
    const bag = [...A, ...B]
    shuffleInPlace(bag)
    for (let i = 0; i < bag.length; i += 2) {
      if (bag[i + 1]) pairs.push([bag[i]!, bag[i + 1]!])
    }
    return pairs
  }

  // seeded: A1–B2, B1–A2, A3–B4, B3–A4, ...
  const len = Math.max(A.length, B.length)
  for (let i = 0; i < len; i++) {
    const a1 = A[i]
    const b1 = B[i]
    const a2 = A[i + 1]
    const b2 = B[i + 1]
    if (a1 && b2) pairs.push([a1, b2])
    if (b1 && a2) pairs.push([b1, a2])
    i++ // consumimos de a 2 por grupo
  }
  return pairs
}

/** Empareja una lista: seeded = 1º vs último, 2º vs penúltimo; random = shuffle y toma de a pares */
export function buildPairsFromList(
  list: StandingRow[],
  mode: 'seeded' | 'random' = 'seeded'
): Array<[StandingRow, StandingRow]> {
  const arr = [...list]
  if (mode === 'random') {
    shuffleInPlace(arr)
    const out: Array<[StandingRow, StandingRow]> = []
    for (let i = 0; i + 1 < arr.length; i += 2) out.push([arr[i]!, arr[i + 1]!])
    return out
  }
  // seeded: extremos
  const out: Array<[StandingRow, StandingRow]> = []
  let l = 0, r = arr.length - 1
  while (l < r) {
    out.push([arr[l]!, arr[r]!])
    l++; r--
  }
  return out
}

function shuffleInPlace<T>(a: T[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
}
