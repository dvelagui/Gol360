/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { listTournamentsByManager , createTournament, getTournamentById } from '@/services/tournamentService'
import type { Tournament } from '@/types/auth'

type State = {
  item: Tournament | null
  items: Tournament[]
  loading: boolean
  error: string | null
}

export const useTournamentStore = defineStore('tournaments', {
  state: (): State => ({
    item: null,
    items: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetch(ownerId?: string) {
      this.loading = true
      this.error = null
      try {
        // Por ahora sigue llamando al servicio existente (manager).
        this.items = await listTournamentsByManager(ownerId)
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo cargar torneos'
        this.items = []
      } finally {
        this.loading = false
      }
    },

    async add(payload: Omit<Tournament, 'id' | 'createdAt'>) {
      this.error = null
      try {
        const id = await createTournament(payload)
        // refresca en contexto del mismo dueño (compat: managerId en tu tipo actual)
        // si más adelante renombramos a managerId en el modelo, solo cambiarías esta línea.
        await this.fetch((payload as any).managerId)
        return id
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el torneo'
        throw e
      }
    },

    // crear funcion para traer doc con tournamentId usando funcion getTournamentById de tournamentService
    async fetchById(tournamentId: string) {
      this.loading = true
      this.error = null
      try {
        const tournament = await getTournamentById(tournamentId)
        if (Array.isArray(tournament) && tournament.length > 0) {
          this.item = tournament[0] ?? null
        } else if (tournament && !Array.isArray(tournament)) {
          this.item = tournament
        } else {
          this.item = null
        }

      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo cargar el torneo'
        this.items = []
      } finally {
        this.loading = false
      }
    }
  }
})
