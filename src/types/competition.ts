export type MatchStatus = 'scheduled' | 'in_progress' | 'finished' | 'canceled' | 'walkover'
export type MatchPhase  = 'regular' | 'playoff' | 'semifinal' | 'final'

export interface Match {
  id: string
  tournamentId: string
  round: number | string
  phase: MatchPhase
  date: number
  dateISO: string
  field: string
  homeTeamId: string
  awayTeamId: string
  referee?: string
  status: MatchStatus
  score: { home: number; away: number }
  confirmedBy: 'manager' | 'admin' | null
  notes?: string
  createdBy: string
  createdAt: number
}
