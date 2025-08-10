/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { listPlayersByTeam, createPlayer, promoteToCaptain } from '@/services/playerService'
import type { Player } from '@/types/auth'

type State = {
  items: Player[]
  loading: boolean
  error: string | null
}

export const usePlayerStore = defineStore('players', {
  state: (): State => ({
    items: [],
    loading: false,
    error: null
  }),

  getters: {
    count: (s) => s.items.length,
    byId: (s) => (id: string) => s.items.find(p => p.id === id) || null,
    byNumber: (s) => (n: number) => s.items.find(p => p.jersey === n) || null
  },

  actions: {
    async fetch(teamId: string) {
      this.loading = true
      this.error = null
      try {
        this.items = await listPlayersByTeam(teamId)
      } catch (e: any) {
        this.items = []
        this.error = e?.message ?? 'No se pudieron cargar los jugadores'
      } finally {
        this.loading = false
      }
    },

    async add(payload: Omit<Player, 'id' | 'createdAt'>) {
      this.error = null
      try {
        const id = await createPlayer(payload)
        await this.fetch(payload.teamId)
        return id
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el jugador'
        throw e
      }
    },

    // Opcional: ascender a capitán y refrescar lista
    async promote(playerId: string, teamId: string) {
      this.error = null
      try {
        await promoteToCaptain(playerId)
        await this.fetch(teamId)
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo ascender a capitán'
        throw e
      }
    }
  }
})
