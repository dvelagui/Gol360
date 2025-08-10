/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { listTeamsByTournament, createTeam } from '@/services/teamService'
import type { Team } from '@/types/auth'

type State = {
  items: Team[]
  loading: boolean
  error: string | null
}

export const useTeamStore = defineStore('teams', {
  state: (): State => ({
    items: [],
    loading: false,
    error: null
  }),

  getters: {
    count: (s) => s.items.length,
    byId: (s) => (id: string) => s.items.find(t => t.id === id) || null
  },

  actions: {
    async fetch(tournamentId: string) {
      this.loading = true
      this.error = null
      try {
        this.items = await listTeamsByTournament(tournamentId)
      } catch (e: any) {
        this.items = []
        this.error = e?.message ?? 'No se pudieron cargar los equipos'
      } finally {
        this.loading = false
      }
    },

    async add(payload: Omit<Team, 'id' | 'createdAt'>) {
      this.error = null
      try {
        const id = await createTeam(payload)
        await this.fetch(payload.tournamentId)
        return id
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el equipo'
        throw e
      }
    }
  }
})
