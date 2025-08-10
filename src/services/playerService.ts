/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, doc, getDoc, getDocs, query, where,
  updateDoc, deleteDoc, serverTimestamp, type Query
} from 'firebase/firestore'
import { colPlayers } from './firestore/collections'
import type { Player } from '@/types/auth'

/** Crea un jugador y devuelve el id */
export async function createPlayer(
  data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(colPlayers, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  } as any)
  return ref.id
}

/** Obtiene un jugador por id */
export async function getPlayer(id: string): Promise<Player | null> {
  const snap = await getDoc(doc(colPlayers, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Player) : null
}

/** Lista jugadores de un equipo */
export async function listPlayersByTeam(teamId: string): Promise<Player[]> {
  const q: Query = query(colPlayers, where('teamId', '==', teamId))
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as Player))
}

/** Ascender a capitán (mantengo el naming actual de tu dominio) */
export async function promoteToCaptain(playerId: string): Promise<void> {
  await updateDoc(doc(colPlayers, playerId), {
    role: 'team',
    updatedAt: serverTimestamp()
  } as any)
}

/** Actualiza campos del jugador y marca updatedAt */
export async function updatePlayer(id: string, data: Partial<Player>): Promise<void> {
  await updateDoc(doc(colPlayers, id), {
    ...data,
    updatedAt: serverTimestamp()
  } as any)
}

/** Elimina un jugador por id */
export async function removePlayer(id: string): Promise<void> {
  await deleteDoc(doc(colPlayers, id))
}
