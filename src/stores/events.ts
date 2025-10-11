import { defineStore } from 'pinia'
import type { MatchEvent } from '@/types/competition'
import { listEvents, listEventsByTournament, addEvent, approveEvent, rejectEvent, removeEvent, updateEvent } from '@/services/eventService'

export const useEventStore = defineStore('events', {
  state: () => ({
    items: [] as MatchEvent[],
    loading: false
  }),
  actions: {
    async fetch(matchId: string) {
      this.loading = true
      try { this.items = await listEvents(matchId) }
      finally { this.loading = false }
    },
    async fetchByTournament(tournamentId: string) {
      this.loading = true
      try { this.items = await listEventsByTournament(tournamentId) }
      finally { this.loading = false }
    },
    async create(evt: Parameters<typeof addEvent>[0]) {
      const id = await addEvent(evt)
      await this.fetch(evt.matchId)
      return id
    },
    async approve(id: string, matchId: string) {
      await approveEvent(id)
      await this.fetch(matchId)
    },
    async reject(id: string, matchId: string) {
      await rejectEvent(id)
      await this.fetch(matchId)
    },
    async remove(id: string, matchId: string) {
      await removeEvent(id)
      await this.fetch(matchId)
    },
    async update(id: string, patch: Partial<MatchEvent>, matchId: string) {
      await updateEvent(id, patch)
      await this.fetch(matchId)
    }
  }
})
