import { defineStore } from 'pinia'
import { listTeamsByTournament } from '@/services/teamService'
import { listMatchesByTournament } from '@/services/matchService'
import { computeStandings, applyDisciplineFromEvents, type StandingRow } from '@/utils/standings'
import type { MatchStatus } from '@/types/competition'

type State = {
  tournamentId: string
  table: StandingRow[]
  loading: boolean
  lastUpdated: number | null
}

export const useStandingStore = defineStore('standings', {
  state: (): State => ({
    tournamentId: '',
    table: [],
    loading: false,
    lastUpdated: null
  }),

  actions: {
    /**
     * Carga equipos y partidos finalizados del torneo y calcula la tabla.
     * No requiere eventos; si luego quieres inyectar disciplina, usa `applyDiscipline(...)`.
     */
    async fetch(tournamentId: string): Promise<void> {
      this.loading = true
      this.tournamentId = tournamentId
      try {
        // 1) Equipos (solo id y nombre para standings)
        const teams = await listTeamsByTournament(tournamentId)
        const teamsMin = teams.map(t => ({ id: t.id, name: t.displayName }))

        // 2) Partidos finalizados
        const FINISHED: MatchStatus = 'terminado'
        const matches = await listMatchesByTournament(tournamentId, { status: FINISHED })

        // 3) Cálculo local
        this.table = computeStandings(teamsMin, matches)
        this.lastUpdated = Date.now()
      } finally {
        this.loading = false
      }
    },

    /**
     * Opcional: aplica disciplina (amarillas/rojas) si ya tienes eventos en memoria.
     * Pasa un arreglo de eventos mínimos { teamId, type: 'yellow'|'red', ... }.
     */
    applyDiscipline(events: Parameters<typeof applyDisciplineFromEvents>[1]): void {
      if (!this.table.length) return
      this.table = applyDisciplineFromEvents(this.table, events)
      this.lastUpdated = Date.now()
    }
  }
})
