/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, doc, getDoc, getDocs, query, where,
  updateDoc, deleteDoc, serverTimestamp, type Query
} from 'firebase/firestore'
import { colTeams } from './firestore/collections'
import type { Team } from '@/types/auth'

// Crea un equipo y devuelve el id del documento
export async function createTeam(
  data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(colTeams, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  } as any)
  return ref.id
}

// Obtiene un equipo por id (útil en vistas de detalle/edición)
export async function getTeam(id: string): Promise<Team | null> {
  const snap = await getDoc(doc(colTeams, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as Team) : null
}

// Lista equipos de un torneo
export async function listTeamsByTournament(tournamentId: string): Promise<Team[]> {
  const q: Query = query(colTeams, where('tournamentId', '==', tournamentId))
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Team))
}

// Actualiza campos del equipo y marca updatedAt
export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  await updateDoc(doc(colTeams, id), {
    ...data,
    updatedAt: serverTimestamp()
  } as any)
}

// Elimina un equipo por id
export async function removeTeam(id: string): Promise<void> {
  await deleteDoc(doc(colTeams, id))
}
