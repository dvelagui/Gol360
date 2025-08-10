/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { listTournamentsByManager , createTournament } from '@/services/tournamentService'
import type { Tournament } from '@/types/auth'

type State = {
  items: Tournament[]
  loading: boolean
  error: string | null
}

export const useTournamentStore = defineStore('tournaments', {
  state: (): State => ({
    items: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetch(ownerId?: string) {
      this.loading = true
      this.error = null
      try {
        // Por ahora sigue llamando al servicio existente (organizer).
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
        // refresca en contexto del mismo dueño (compat: organizerId en tu tipo actual)
        // si más adelante renombramos a managerId en el modelo, solo cambiarías esta línea.
        await this.fetch((payload as any).organizerId)
        return id
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el torneo'
        throw e
      }
    }
  }
})
