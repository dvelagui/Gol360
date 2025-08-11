import { defineStore } from 'pinia'
import type { Match, MatchStatus, MatchPhase } from '@/types/competition'
import { listMatchesByTournament, createMatch, updateMatch, removeMatch, setMatchStatus } from '@/services/matchService'
import { useUserStore } from '@/stores/user'

export const useMatchStore = defineStore('matches', {
  state: () => ({
    items: [] as Match[],
    loading: false as boolean,
  }),
  actions: {
    async fetch(tournamentId: string, opts?: { status?: MatchStatus; phase?: MatchPhase; round?: string|number }) {
      this.loading = true
      try {
        this.items = await listMatchesByTournament(tournamentId, opts)
      } finally {
        this.loading = false
      }
    },
    async create(form: Match) {
      const uid = useUserStore().user?.uid || ''
      const { dateISO, ...rest } = form
      if (!dateISO) throw new Error('dateISO is required')
      const id = await createMatch({ ...rest, dateISO }, { uid })
      return id
    },
    async update(id: string, patch: Partial<Match>) {
      await updateMatch(id, patch)
      const idx = this.items.findIndex(m => m.id === id)
      if (idx >= 0) this.items[idx] = { ...this.items[idx], ...patch } as Match
    },
    async remove(id: string) {
      await removeMatch(id)
      this.items = this.items.filter(m => m.id !== id)
    },
    async setStatus(id: string, status: MatchStatus) {
      await setMatchStatus(id, status)
      const m = this.items.find(x => x.id === id)
      if (m) m.status = status
    }
  }
})
