export type MatchStatus = 'programado'|'en progreso'|'terminado'|'cancelado'|'walkover'
export type MatchPhase  = 'grupos' | 'eliminatoria' | 'semifinal' | 'final'

export interface SelectOption<T> {
  label: string
  value: T
}

export type MatchStatusOption = SelectOption<MatchStatus>
export type MatchPhaseOption = SelectOption<MatchPhase>

export type EventType =
  | 'gol' | 'asistencia' | 'autogol'
  | 'amarilla' | 'roja'
  | 'penalti_marcado' | 'penalti_fallado'
  | 'sub_id' | 'sub_out'

export interface Match {
  id: string
  tournamentId: string
  round: number | string
  phase: MatchPhase
  date: number // timestamp ms
  field: string
  homeTeamId: { id: string; name: string }
  awayTeamId: { id: string; name: string }
  referee?: string
  status: MatchStatus
  score: { home: number; away: number }
  confirmedBy: 'manager' | 'admin' | null
  notes?: string
  createdBy: string
  createdAt: number
}

export interface MatchEvent {
  id: string
  matchId: string
  tournamentId: string
  teamId: { id: string; name: string }
  playerId?: { id: string; name: string }
  type: EventType
  minute: number
  extraTime?: number | null
  meta?: { description?: string; videoUrl?: string }
  createdBy: string // uid
  status: 'propuesto' | 'aprobado' | 'rechazado'
  createdAt: number
}
