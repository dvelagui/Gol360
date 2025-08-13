/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  orderBy, doc, getDoc, getDocs, query, where,
  updateDoc, deleteDoc, serverTimestamp, setDoc, type Query
} from 'firebase/firestore'
import { colTeams } from './firestore/collections'
import type { Team } from '@/types/auth'



// Crea un equipo y devuelve el id del documento
export async function createTeam(payload: Omit<Team,'id'|'createdAt'|'createdBy'>, ctx: { uid: string }): Promise<string> {
  const ref = doc(colTeams) // id auto
  const data: Team = {
    id: ref.id,
    tournamentId: payload.tournamentId,
    displayName: payload.displayName,
    city: payload.city,
    group: payload.group ?? "",
    colors: payload.colors ?? {},
    crestUrl: payload.crestUrl ?? "",
    captainId: payload.captainId ?? "",
    createdBy: ctx.uid,
    createdAt: serverTimestamp()
  }
  await setDoc(ref, data)
  return ref.id
}

// Obtiene un equipo por id (útil en vistas de detalle/edición)
export async function getTeam(id: string): Promise<Team | null> {
  const snap = await getDoc(doc(colTeams, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as Team) : null
}

// Lista equipos de un torneo
export async function listTeamsByTournament(tournamentId: string): Promise<Team[]> {
  const q: Query = query(colTeams, where('tournamentId', '==', tournamentId), orderBy('displayName', 'asc'))
  const snaps = await getDocs(q)
  return snaps.docs.map(d => d.data() as Team)
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

/** Establece capitán único: setea team.captainId y role='captain' del jugador (y revierte el anterior si lo había) */
export async function setTeamCaptain(id: string, playerId: string | null): Promise<void> {
  // Actualiza solo el team; el ajuste de role del jugador lo hacemos desde playerService.setCaptain
 await updateDoc(doc(colTeams, id), { captainId: playerId ?? "" } as any)
}
