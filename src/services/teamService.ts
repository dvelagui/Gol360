/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  orderBy,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  type Query
} from 'firebase/firestore'
import { colTeams } from './firestore/collections'
import type { Team } from '@/types/auth'

/**
 * Crea un equipo y devuelve el id del documento
 * - Usa displayName (no name)
 * - Normaliza opcionales y fija createdBy/createdAt
 */
export async function createTeam(
  payload: Omit<Team, 'id' | 'createdAt' | 'createdBy'>,
  ctx: { uid: string }
): Promise<string> {
  const ref = doc(colTeams) // id auto
  const data: Team = {
    id: ref.id,
    tournamentId: payload.tournamentId,
    displayName: payload.displayName,           // ✅ displayName
    city: payload.city ?? '',
    group: payload.group ?? '',
    colors: payload.colors ?? {},               // si usas objeto { home, away }
    crestUrl: payload.crestUrl ?? '',
    captainId: payload.captainId ?? '',
    createdBy: ctx.uid,
    createdAt: serverTimestamp()
  }
  await setDoc(ref, data)
  return ref.id
}

/**
 * Obtiene un equipo por id
 */
export async function getTeam(id: string): Promise<Team | null> {
  const snap = await getDoc(doc(colTeams, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as Team) : null
}

/**
 * Lista equipos de un torneo
 * - Ordena por displayName (asegúrate de tener índice si Firestore te lo pide)
 */
export async function listTeamsByTournament(tournamentId: string): Promise<Team[]> {
  const q: Query = query(
    colTeams,
    where('tournamentId', '==', tournamentId),
    orderBy('displayName', 'asc')               // ✅ displayName
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Team))
}

/**
 * Actualiza campos del equipo y marca updatedAt
 * - No envía undefined (si tu lint reclama, puedes filtrar antes)
 */
export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  // opcional: filtrado simple de undefineds
  const patch = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )
  await updateDoc(doc(colTeams, id), {
    ...patch,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Elimina un equipo por id
 */
export async function removeTeam(id: string): Promise<void> {
  await deleteDoc(doc(colTeams, id))
}

/**
 * Establece capitán único del equipo:
 * - Actualiza team.captainId (string o vacío)
 * - El ajuste de roles en jugadores se hace en playerService.setCaptain(...)
 */
export async function setTeamCaptain(teamId: string, playerId: string | null): Promise<void> {
  await updateDoc(doc(colTeams, teamId), {
    captainId: playerId ?? '',
    updatedAt: serverTimestamp()
  } as any)
}
