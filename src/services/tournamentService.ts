/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp, type Query
} from 'firebase/firestore'
import { colTournaments } from './firestore/collections'
import type { Tournament } from '@/types/auth'

export async function createTournament(
  data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(colTournaments, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  } as any)
  return ref.id
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const snap = await getDoc(doc(colTournaments, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as Tournament) : null
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
    updatedAt: serverTimestamp()
  } as any)
}

export async function removeTournament(id: string): Promise<void> {
  await deleteDoc(doc(colTournaments, id))
}
