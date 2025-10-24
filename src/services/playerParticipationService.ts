/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  collection
} from 'firebase/firestore'
import { db } from '@/boot/firebase'
import type { PlayerParticipation } from '@/types/auth'

const colParticipations = collection(db, 'playerParticipations')

/**
 * Crea una participación de jugador en un torneo/equipo
 */
export async function createParticipation(
  data: Omit<PlayerParticipation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = doc(colParticipations)
  const dataWithId = {
    ...data,
    id: ref.id,
    joinedAt: data.joinedAt || serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  await setDoc(ref, dataWithId)
  return ref.id
}

/**
 * Obtiene una participación por ID
 */
export async function getParticipation(id: string): Promise<PlayerParticipation | null> {
  const snap = await getDoc(doc(colParticipations, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PlayerParticipation) : null
}

/**
 * Lista todas las participaciones de un jugador (todos sus torneos/equipos)
 */
export async function listParticipationsByPlayer(playerId: string): Promise<PlayerParticipation[]> {
  const q = query(colParticipations, where('playerId', '==', playerId))
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as PlayerParticipation))
}

/**
 * Lista todas las participaciones de un equipo (todos los jugadores del equipo)
 */
export async function listParticipationsByTeam(teamId: string): Promise<PlayerParticipation[]> {
  const q = query(
    colParticipations,
    where('teamId', '==', teamId),
    where('active', '==', true)
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as PlayerParticipation))
}

/**
 * Lista todas las participaciones de un torneo
 */
export async function listParticipationsByTournament(tournamentId: string): Promise<PlayerParticipation[]> {
  const q = query(
    colParticipations,
    where('tournamentId', '==', tournamentId),
    where('active', '==', true)
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as PlayerParticipation))
}

/**
 * Obtiene la participación de un jugador en un equipo/torneo específico
 */
export async function getParticipationByPlayerTeam(
  playerId: string,
  teamId: string,
  tournamentId: string
): Promise<PlayerParticipation | null> {
  const q = query(
    colParticipations,
    where('playerId', '==', playerId),
    where('teamId', '==', teamId),
    where('tournamentId', '==', tournamentId)
  )
  const snaps = await getDocs(q)
  if (snaps.empty || !snaps.docs[0]) return null
  const docSnapshot = snaps.docs[0]
  return { id: docSnapshot.id, ...docSnapshot.data() } as PlayerParticipation
}

/**
 * Verifica si un jugador ya participa en un equipo/torneo
 */
export async function playerExistsInTeam(
  playerId: string,
  teamId: string,
  tournamentId: string
): Promise<boolean> {
  const participation = await getParticipationByPlayerTeam(playerId, teamId, tournamentId)
  return participation !== null && participation.active
}

/**
 * Actualiza una participación
 */
export async function updateParticipation(
  id: string,
  data: Partial<PlayerParticipation>
): Promise<void> {
  await updateDoc(doc(colParticipations, id), {
    ...data,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Desactiva una participación (no la elimina, solo marca como inactiva)
 */
export async function deactivateParticipation(id: string): Promise<void> {
  await updateDoc(doc(colParticipations, id), {
    active: false,
    updatedAt: serverTimestamp()
  })
}

/**
 * Reactiva una participación
 */
export async function reactivateParticipation(id: string): Promise<void> {
  await updateDoc(doc(colParticipations, id), {
    active: true,
    updatedAt: serverTimestamp()
  })
}

/**
 * Elimina permanentemente una participación
 */
export async function removeParticipation(id: string): Promise<void> {
  await deleteDoc(doc(colParticipations, id))
}

/**
 * Cambia el capitán de un equipo
 * - Degrada al capitán actual (role: 'player')
 * - Promueve al nuevo capitán (role: 'team')
 */
export async function setCaptainInTeam(
  teamId: string,
  tournamentId: string,
  newCaptainPlayerId: string | null
): Promise<void> {
  // 1) Buscar capitán actual del equipo
  const qCurrent = query(
    colParticipations,
    where('teamId', '==', teamId),
    where('tournamentId', '==', tournamentId),
    where('role', '==', 'team'),
    where('active', '==', true)
  )
  const currentSnaps = await getDocs(qCurrent)

  // 2) Degradar capitán actual a 'player'
  await Promise.all(
    currentSnaps.docs.map(d =>
      updateDoc(doc(colParticipations, d.id), {
        role: 'player',
        updatedAt: serverTimestamp()
      })
    )
  )

  // 3) Promover nuevo capitán (si hay)
  if (newCaptainPlayerId) {
    const participation = await getParticipationByPlayerTeam(
      newCaptainPlayerId,
      teamId,
      tournamentId
    )
    if (participation) {
      await updateDoc(doc(colParticipations, participation.id), {
        role: 'team',
        updatedAt: serverTimestamp()
      })
    }
  }
}

/**
 * Obtiene todos los torneos en los que participa un jugador
 */
export async function getTournamentIdsByPlayer(playerId: string): Promise<string[]> {
  const participations = await listParticipationsByPlayer(playerId)
  const tournamentIds = new Set<string>()
  participations
    .filter(p => p.active)
    .forEach(p => tournamentIds.add(p.tournamentId))
  return Array.from(tournamentIds)
}

/**
 * Obtiene todos los equipos en los que participa un jugador
 */
export async function getTeamIdsByPlayer(playerId: string): Promise<string[]> {
  const participations = await listParticipationsByPlayer(playerId)
  const teamIds = new Set<string>()
  participations
    .filter(p => p.active)
    .forEach(p => teamIds.add(p.teamId))
  return Array.from(teamIds)
}

/**
 * Obtiene la participación activa de un jugador en un torneo específico
 * Útil para determinar en qué equipo juega el jugador en ese torneo
 */
export async function getPlayerParticipation(
  playerId: string,
  tournamentId: string
): Promise<PlayerParticipation | null> {
  try {
    console.log('[getPlayerParticipation] Searching for:', { playerId, tournamentId })

    // Primero buscar TODAS las participaciones del jugador (sin filtros)
    const qAll = query(colParticipations, where('playerId', '==', playerId))
    const allSnapshot = await getDocs(qAll)
    console.log('[getPlayerParticipation] Total participations for player:', allSnapshot.size)
    allSnapshot.docs.forEach(doc => {
      console.log('  - Participation:', doc.id, doc.data())
    })

    // Ahora buscar las activas en el torneo específico
    const q = query(
      colParticipations,
      where('playerId', '==', playerId),
      where('tournamentId', '==', tournamentId),
      where('active', '==', true)
    )

    const snapshot = await getDocs(q)
    console.log('[getPlayerParticipation] Active participations in tournament:', snapshot.size)

    if (snapshot.empty) {
      console.warn(`[getPlayerParticipation] No active participation found for player=${playerId} in tournament=${tournamentId}`)
      return null
    }

    // Si hay múltiples participaciones (jugador en varios equipos del mismo torneo),
    // retornar la primera
    const doc = snapshot.docs[0]
    if (!doc) return null

    const participation = {
      id: doc.id,
      ...doc.data()
    } as PlayerParticipation

    console.log('[getPlayerParticipation] Found participation:', participation)
    return participation
  } catch (error) {
    console.error('[getPlayerParticipation] Error:', error)
    throw error
  }
}
