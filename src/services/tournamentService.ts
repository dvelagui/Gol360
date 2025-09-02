/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, Timestamp, type Query
} from 'firebase/firestore'
import { colTournaments } from './firestore/collections'
import type { Tournament } from '@/types/auth'
import { genTournamentId } from '@/utils/id'

export async function createTournament(
  data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  data.tournamentId = genTournamentId(data.displayName, data.startDate)
  const ref = await addDoc(colTournaments, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),

  } as any)
  return ref.id
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const snap = await getDoc(doc(colTournaments, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as Tournament) : null
}

//funcion para traer doc con tournamentId
export async function getTournamentById(tournamentId: string): Promise<Tournament[]> {
  const q: Query = tournamentId
    ? query(colTournaments, where('tournamentId', '==', tournamentId))
    : (colTournaments as any)
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Tournament))
}

// Versión alineada a Gol360 (managerId). Úsala cuando cambies el modelo.
export async function listTournamentsByManager(managerId?: string): Promise<Tournament[]> {
  const q: Query = managerId
    ? query(colTournaments, where('managerId', '==', managerId))
    : (colTournaments as any)
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Tournament))
}


export async function updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
  await updateDoc(doc(colTournaments, id), {
    ...data,
    updatedAt: Timestamp.now()
  } as any)
}

export async function removeTournament(id: string): Promise<void> {
  await deleteDoc(doc(colTournaments, id))
}
