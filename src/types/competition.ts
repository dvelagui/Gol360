export type MatchStatus = 'scheduled' | 'in_progress' | 'finished' | 'canceled' | 'walkover'
export type MatchPhase  = 'regular' | 'playoff' | 'semifinal' | 'final'

export interface SelectOption<T> {
  label: string
  value: T
}

export type MatchStatusOption = SelectOption<MatchStatus>
export type MatchPhaseOption = SelectOption<MatchPhase>

export type EventType =
  | 'goal' | 'assist' | 'own_goal'
  | 'yellow' | 'red'
  | 'penalty_scored' | 'penalty_missed'
  | 'sub_in' | 'sub_out'

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
  teamId: string
  playerId?: string | null
  type: EventType
  minute: number
  extraTime?: number | null
  meta?: { description?: string; videoUrl?: string }
  createdBy: string // uid
  status: 'proposed' | 'approved' | 'rejected'
  createdAt: number
}
