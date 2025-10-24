/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import type { Player, PlayerParticipation } from '@/types/auth'
import {
  listPlayersByTeam,
  listPlayersByEmail,
  getPlayer,
  createPlayer,
  updatePlayer,
  removePlayer,
  setCaptain as setTeamCaptain, // cambio de capitán único por equipo
  promoteToCaptain, // compatibilidad con tu flujo previo (opcional)
  // Nuevas funciones
  getPlayerByEmail,
  createPlayerWithParticipation,
  createPlayerWithAccountAndParticipation,
  listPlayersWithParticipationsByTeam
} from '@/services/playerService'
import {
  setCaptainInTeam,
  updateParticipation,
  deactivateParticipation,
  getTournamentIdsByPlayer
} from '@/services/playerParticipationService'

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
    async fetchByEmail(email: string): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const players = await listPlayersByEmail(email)
        this.items = players
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
        // Solo refrescar si el payload tiene teamId
        if (payload.teamId) {
          await this.fetch(payload.teamId)
        }
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
    },

    // ============================================================
    // NUEVO SISTEMA: PlayerParticipations
    // ============================================================

    /**
     * Carga jugadores de un equipo usando el nuevo sistema de participaciones
     */
    async fetchByTeamWithParticipations(teamId: string): Promise<void> {
      this.loading = true
      this.error = null
      try {
        this.items = await listPlayersWithParticipationsByTeam(teamId)
      } catch (e: any) {
        this.items = []
        this.error = e?.message ?? 'No se pudieron cargar los jugadores'
      } finally {
        this.loading = false
      }
    },

    /**
     * Busca un jugador por email (para detectar duplicados)
     */
    async findByEmail(email: string): Promise<Player | null> {
      this.error = null
      try {
        return await getPlayerByEmail(email)
      } catch (e: any) {
        this.error = e?.message ?? 'Error buscando jugador'
        return null
      }
    },

    /**
     * Crea jugador con participación (nuevo sistema)
     * Detecta automáticamente si el jugador existe por email
     */
    async addWithParticipation(data: {
      displayName: string
      email?: string
      photoURL?: string | null
      tournamentId: string
      teamId: string
      jersey?: number
      position?: string
      role?: 'player' | 'team'
      createdBy: string
    }): Promise<{ playerId: string; participationId: string; isExisting: boolean }> {
      this.error = null
      try {
        const result = await createPlayerWithParticipation(data)

        // Refrescar lista de jugadores del equipo
        await this.fetchByTeamWithParticipations(data.teamId)

        return result
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el jugador'
        throw e
      }
    },

    /**
     * Crea jugador CON cuenta de Authentication y participación (nuevo sistema)
     * Crea usuario en Firebase Auth, documento en users/, players/ y PlayerParticipations/
     */
    async addWithAccountAndParticipation(data: {
      displayName: string
      email: string
      password?: string
      photoURL?: string | null
      tournamentId: string
      teamId: string
      jersey?: number
      position?: string
      role?: 'player' | 'team'
      createdBy: string
    }): Promise<{ playerId: string; participationId: string; isExisting: boolean }> {
      this.error = null
      try {
        const result = await createPlayerWithAccountAndParticipation(data)

        // Refrescar lista de jugadores del equipo
        await this.fetchByTeamWithParticipations(data.teamId)

        return result
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el jugador con cuenta'
        throw e
      }
    },

    /**
     * Actualiza la participación de un jugador (jersey, posición, etc.)
     */
    async updateParticipation(participationId: string, data: Partial<PlayerParticipation>) {
      this.error = null
      try {
        await updateParticipation(participationId, data)

        // Actualizar en cache local si el jugador está cargado
        const idx = this.items.findIndex(p => (p as any).participation?.id === participationId)
        if (idx >= 0) {
          const player = this.items[idx] as any
          this.items[idx] = {
            ...player,
            ...data, // Actualizar campos de compatibilidad
            participation: {
              ...player.participation,
              ...data
            }
          }
        }
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo actualizar la participación'
        throw e
      }
    },

    /**
     * Desactiva la participación de un jugador en un equipo/torneo
     */
    async deactivatePlayerFromTeam(participationId: string) {
      this.error = null
      try {
        await deactivateParticipation(participationId)

        // Remover de cache local
        this.items = this.items.filter(p => (p as any).participation?.id !== participationId)
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo desactivar el jugador'
        throw e
      }
    },

    /**
     * Cambia el capitán usando el nuevo sistema de participaciones
     */
    async setCaptainWithParticipations(teamId: string, tournamentId: string, newCaptainPlayerId: string | null) {
      this.error = null
      try {
        await setCaptainInTeam(teamId, tournamentId, newCaptainPlayerId)

        // Actualizar cache local
        this.items = this.items.map(p => {
          const player = p as any
          if (player.participation?.teamId === teamId && player.participation?.tournamentId === tournamentId) {
            const isNewCaptain = player.id === newCaptainPlayerId
            return {
              ...player,
              role: isNewCaptain ? 'team' : 'player',
              participation: {
                ...player.participation,
                role: isNewCaptain ? 'team' : 'player'
              }
            }
          }
          return p
        })
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo cambiar el capitán'
        throw e
      }
    },

    /**
     * Obtiene los IDs de torneos en los que participa un jugador
     */
    async getPlayerTournaments(playerId: string): Promise<string[]> {
      this.error = null
      try {
        return await getTournamentIdsByPlayer(playerId)
      } catch (e: any) {
        this.error = e?.message ?? 'Error obteniendo torneos del jugador'
        return []
      }
    }
  }
})
