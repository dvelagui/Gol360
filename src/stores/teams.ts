/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia';
import { useUserStore } from '@/stores/user';
import type { Team } from '@/types/auth';
import {
  listTeamsByTournament,
  createTeam,
  updateTeam,
  removeTeam,
  setTeamCaptain,
} from '@/services/teamService';

type State = {
  items: Team[];
  loading: boolean;
  error: string | null;
};

export const useTeamStore = defineStore('teams', {
  state: (): State => ({
    items: [],
    loading: false,
    error: null,
  }),

  getters: {
    count: (s) => s.items.length,
    byId: (s) => (id: string) => s.items.find((t) => t.id === id) || null,
  },

  actions: {
    async fetch(tournamentId: string) {
      this.loading = true;
      this.error = null;
      try {
        this.items = await listTeamsByTournament(tournamentId);
      } catch (e: any) {
        this.items = [];
        this.error = e?.message ?? 'No se pudieron cargar los equipos';
      } finally {
        this.loading = false;
      }
    },

    /** Crea un equipo y refresca la lista del torneo */
    async add(payload: Omit<Team, 'id' | 'createdAt'>) {
      this.error = null;
      try {
        const uid = useUserStore().user?.uid || '';
        const id = await createTeam(payload, { uid });
        await this.fetch(payload.tournamentId);
        return id;
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo crear el equipo';
        throw e;
      }
    },

    /** Actualiza datos del equipo y sincroniza el cache local */
    async update(id: string, patch: Partial<Team>) {
      this.error = null;
      try {
        await updateTeam(id, patch);
        const idx = this.items.findIndex((t) => t.id === id);
        if (idx >= 0) {
          const updatedTeam = { ...this.items[idx], ...patch } as Required<Team>;
          this.items[idx] = updatedTeam;
        }
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo actualizar el equipo';
        throw e;
      }
    },

    /** Elimina un equipo y limpia del estado */
    async remove(id: string) {
      this.error = null;
      try {
        await removeTeam(id);
        this.items = this.items.filter((t) => t.id !== id);
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo eliminar el equipo';
        throw e;
      }
    },

    /** Establece (o limpia) el capitán del equipo */
    async setCaptain(teamId: string, playerId: string | null) {
      this.error = null;
      try {
        await setTeamCaptain(teamId, playerId);
        const team = this.items.find((t) => t.id === teamId);
        if (team) team.captainId = playerId ?? '';
      } catch (e: any) {
        this.error = e?.message ?? 'No se pudo asignar el capitán';
        throw e;
      }
    },
  },
});
