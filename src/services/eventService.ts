/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/eventService.ts
import { db } from '@/boot/firebase'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, doc, updateDoc, deleteDoc,
} from 'firebase/firestore'
import type { MatchEvent } from '@/types/competition'
import { cleanUndefined } from '@/utils/sanitize'

const col = collection(db, 'matchEvents')

export async function listEvents(matchId: string): Promise<MatchEvent[]> {
  const q = query(col, where('matchId', '==', matchId), orderBy('minute', 'asc'), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
}

export async function addEvent(payload: Omit<MatchEvent,'id'|'createdAt'|'status'> & { status?: 'proposed'|'approved' }) {
  const docData = cleanUndefined({
    ...payload,
    status: payload.status ?? 'proposed',
    createdAt: Date.now()
  })
  const ref = await addDoc(col, docData as any)
  return ref.id
}

export async function updateEvent(id: string, patch: Partial<MatchEvent>) {
  await updateDoc(doc(col, id), cleanUndefined(patch as any))
}

export async function approveEvent(id: string) {
  await updateDoc(doc(col, id), { status: 'approved' })
}

export async function rejectEvent(id: string) {
  await updateDoc(doc(col, id), { status: 'rejected' })
}

export async function removeEvent(id: string) {
  await deleteDoc(doc(col, id))
}

/** Recalcula marcador localmente a partir de eventos aprobados */
export function computeScoreFromEvents(events: MatchEvent[], homeTeamId: string, awayTeamId: string) {
  let home = 0, away = 0
  for (const e of events.filter(x => x.status === 'aprobado')) {
    if (e.type === 'gol' || e.type === 'penalti_marcado' || e.type === 'autogol') {
      // autogol suma al rival
      const creditTo = e.type === 'autogol'
        ? (e.teamId.id === homeTeamId ? awayTeamId : homeTeamId)
        : e.teamId
      if (creditTo === homeTeamId) home++
      if (creditTo === awayTeamId) away++
    }
  }
  return { home, away }
}
