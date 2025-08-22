/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import type { Player } from '@/types/auth'
import {
  listPlayersByTeam,
  getPlayer,
  createPlayer,
  updatePlayer,
  removePlayer,
  setCaptain as setTeamCaptain, // cambio de capitán único por equipo
  promoteToCaptain // compatibilidad con tu flujo previo (opcional)
} from '@/services/playerService'

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
    byNumber: (s) => (n: number) => s.items.find(p => p.jersey === n) || null,
    currentCaptain: (s) => s.items.find(p => p.role === 'team') || null
  },

  actions: {
    /** Carga jugadores de un equipo */
    async fetchByTeam(teamId: string): Promise<void>  {
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
     async fetch(teamId: string): Promise<void> {
      return this.fetchByTeam(teamId)
    },
    async fetchById(id: string): Promise<Player | null> {
      const playerById =  await getPlayer(id)
      return playerById
    },

    /** Crea jugador y refresca la lista del equipo */
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

    /** Actualiza datos del jugador y sincroniza cache local */
    async update(id: string, patch: Partial<Player>) {
      this.error = null
      try {
        await updatePlayer(id, patch)
        const idx = this.items.findIndex(p => p.id === id)
        if (idx >= 0) {
          const updatedPlayer = { ...this.items[idx], ...patch } as Required<Player>
          this.items[idx] = updatedPlayer
        }
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo actualizar el jugador'
        throw e
      }
    },

    /** Elimina un jugador y lo quita del estado */
    async remove(id: string) {
      this.error = null
      try {
        await removePlayer(id)
        this.items = this.items.filter(p => p.id !== id)
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo eliminar el jugador'
        throw e
      }
    },

    /**
     * Cambia el capitán del equipo (garantiza unicidad):
     * - Degrada capitán actual -> role: 'player'
     * - Promueve nuevo -> role: 'team'
     * - Actualiza team.captainId
     */
    async setCaptain(teamId: string, newCaptainId: string | null) {
      this.error = null
      try {
        await setTeamCaptain(teamId, newCaptainId)
        const prevId = this.items.find(p => p.role === 'team')?.id || null

        this.items = this.items.map(p => {
          if (prevId && p.id === prevId) return { ...p, role: 'player' }
          if (newCaptainId && p.id === newCaptainId) return { ...p, role: 'team' }
          return p
        })
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo asignar el capitán'
        throw e
      }
    },

    /**
     * (Compatibilidad) Promueve a capitán un jugador específico.
     * Recomendación: usar setCaptain(teamId, playerId) para garantizar unicidad.
     */
    async promote(playerId: string, teamId: string) {
      this.error = null
      try {
        // Opción 1 (compat): usa tu servicio previo
        await promoteToCaptain(playerId)
        // Asegura unicidad con la función nueva (degrada anteriores y fija team.captainId)
        await setTeamCaptain(teamId, playerId)
        await this.fetch(teamId)
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo ascender a capitán'
        throw e
      }
    }
  }
})
