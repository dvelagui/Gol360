/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Query,
  orderBy
} from 'firebase/firestore'
import { colPlayers, colTeams } from './firestore/collections'
import type { Player } from '@/types/auth'

/**
 * Crea un jugador y devuelve el id
 */
export async function createPlayer(
  data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(colPlayers, {
    ...data,
    // por defecto un jugador nuevo está activo (si tu tipo lo contempla)
    active: (data as any).active ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  } as any)
  return ref.id
}

/**
 * Obtiene un jugador por id
 */
export async function getPlayer(id: string): Promise<Player | null> {
  const snap = await getDoc(doc(colPlayers, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Player) : null
}

/**
 * Lista jugadores de un equipo (ordenados por nombre si existe el campo)
 */
export async function listPlayersByTeam(teamId: string): Promise<Player[]> {
  // Si no tienes índice por displayName, puedes quitar el orderBy
  const q: Query = query(colPlayers, where('teamId', '==', teamId), orderBy('displayName', 'asc'))
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as Player))
}

/**
 * (Compatibilidad) Promueve a capitán UN jugador (no maneja el anterior ni el team)
 * Nota: Mantengo el nombre que ya usabas pero ajusto el rol a 'captain'
 */
export async function promoteToCaptain(playerId: string): Promise<void> {
  await updateDoc(doc(colPlayers, playerId), {
    role: 'captain',
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Cambia el capitán del equipo garantizando unicidad:
 * - Degrada al capitán actual (si existe) -> role: 'player'
 * - Promueve al nuevo (si newCaptainId no es null) -> role: 'captain'
 * - Actualiza el team.captainId con el nuevo (o null)
 */
export async function setCaptain(teamId: string, newCaptainId: string | null): Promise<void> {
  // 1) Buscar capitán actual (si lo hay)
  const currentCapSnap = await getDocs(
    query(colPlayers, where('teamId', '==', teamId), where('role', '==', 'captain'))
  )

  // 2) Degradar capitán actual a 'player'
  await Promise.all(
    currentCapSnap.docs.map(d =>
      updateDoc(doc(colPlayers, d.id), {
        role: 'player',
        updatedAt: serverTimestamp()
      } as any)
    )
  )

  // 3) Promover nuevo capitán (si aplica)
  if (newCaptainId) {
    await updateDoc(doc(colPlayers, newCaptainId), {
      role: 'captain',
      updatedAt: serverTimestamp()
    } as any)
  }

  // 4) Reflejar en el documento del equipo
  await updateDoc(doc(colTeams, teamId), {
    captainId: newCaptainId ?? null,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Actualiza campos del jugador y marca updatedAt
 */
export async function updatePlayer(id: string, data: Partial<Player>): Promise<void> {
  await updateDoc(doc(colPlayers, id), {
    ...data,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Elimina un jugador por id
 */
export async function removePlayer(id: string): Promise<void> {
  await deleteDoc(doc(colPlayers, id))
}
