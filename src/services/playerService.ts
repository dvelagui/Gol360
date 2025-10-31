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
  type Query,
  orderBy,
  setDoc,
  limit
} from 'firebase/firestore'
import { colPlayers, colTeams } from './firestore/collections'
import type { Player, PlayerParticipation } from '@/types/auth'
import {
  createParticipation,
  listParticipationsByTeam,
  getParticipationByPlayerTeam
} from './playerParticipationService'

/**
 * Crea un jugador y devuelve el id
 */
export async function createPlayer(
  data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = doc(colPlayers) // id auto
  const dataWithId =  {
    ...data,
    // por defecto un jugador nuevo está activo (si tu tipo lo contempla)
    active: (data as any).active ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    id: ref.id
  }
  await setDoc(ref, dataWithId)
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
export async function listPlayersByEmail(email: string): Promise<Player[]> {
  const q: Query = query(colPlayers, where('email', '==', email))
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as Player))
}

/**
 * (Compatibilidad) Promueve a capitán UN jugador (no maneja el anterior ni el team)
 * Nota: Mantengo el nombre que ya usabas pero ajusto el rol a 'team'
 */
export async function promoteToCaptain(playerId: string): Promise<void> {
  await updateDoc(doc(colPlayers, playerId), {
    role: 'team',
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Cambia el capitán del equipo garantizando unicidad:
 * - Degrada al capitán actual (si existe) -> role: 'player'
 * - Promueve al nuevo (si newCaptainId no es null) -> role: 'team'
 * - Actualiza el team.captainId con el nuevo (o null)
 */
export async function setCaptain(teamId: string, newCaptainId: string | null): Promise<void> {
  // 1) Buscar capitán actual (si lo hay)
  const currentCapSnap = await getDocs(
    query(colPlayers, where('teamId', '==', teamId), where('role', '==', 'team'))
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
      role: 'team',
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

// ============================================================
// NUEVO SISTEMA: PlayerParticipations
// ============================================================

/**
 * Busca un jugador por email
 */
export async function getPlayerByEmail(email: string): Promise<Player | null> {
  const q = query(colPlayers, where('email', '==', email), limit(1))
  const snaps = await getDocs(q)
  if (snaps.empty || !snaps.docs[0]) return null
  const docSnapshot = snaps.docs[0]
  return { id: docSnapshot.id, ...docSnapshot.data() } as Player
}

/**
 * Crea un jugador básico (sin equipo/torneo)
 * Para agregar a equipos/torneos usar createParticipation
 */
export async function createPlayerBasic(
  data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = doc(colPlayers)
  const dataWithId = {
    ...data,
    id: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  await setDoc(ref, dataWithId)
  return ref.id
}

/**
 * Crea o actualiza un jugador y su participación en un equipo/torneo
 * - Si el email existe, devuelve el jugador existente
 * - Si no existe, crea uno nuevo
 * - Siempre crea la participación (si no existe ya)
 */
export async function createPlayerWithParticipation(data: {
  // Datos del jugador
  displayName: string
  email?: string
  photoURL?: string | null
  createdBy: string

  // Datos de la participación
  tournamentId: string
  teamId: string
  jersey?: number
  position?: string
  role?: 'player' | 'team' | 'coach'
}): Promise<{ playerId: string; participationId: string; isExisting: boolean }> {
  let playerId: string
  let isExisting = false

  // 1) Buscar si existe jugador con ese email
  if (data.email) {
    const existingPlayer = await getPlayerByEmail(data.email)
    if (existingPlayer) {
      playerId = existingPlayer.id
      isExisting = true
      console.log(`✅ Jugador existente encontrado: ${existingPlayer.displayName} (${playerId})`)
    } else {
      // Crear nuevo jugador
      const playerData: Partial<Player> = {
        displayName: data.displayName,
        email: data.email,
        createdBy: data.createdBy
      }
      // Solo agregar photoURL si no es undefined
      if (data.photoURL !== undefined) {
        playerData.photoURL = data.photoURL
      }
      playerId = await createPlayerBasic(playerData as Omit<Player, 'id' | 'createdAt' | 'updatedAt'>)
      console.log(`✨ Nuevo jugador creado: ${data.displayName} (${playerId})`)
    }
  } else {
    // Sin email, siempre crear nuevo
    const playerData: Partial<Player> = {
      displayName: data.displayName,
      createdBy: data.createdBy
    }
    // Solo agregar photoURL si no es undefined
    if (data.photoURL !== undefined) {
      playerData.photoURL = data.photoURL
    }
    playerId = await createPlayerBasic(playerData as Omit<Player, 'id' | 'createdAt' | 'updatedAt'>)
    console.log(`✨ Nuevo jugador creado (sin email): ${data.displayName} (${playerId})`)
  }

  // 2) Verificar si ya tiene participación en este equipo/torneo
  const existingParticipation = await getParticipationByPlayerTeam(
    playerId,
    data.teamId,
    data.tournamentId
  )

  if (existingParticipation) {
    console.log(`⚠️  El jugador ya participa en este equipo/torneo`)
    return {
      playerId,
      participationId: existingParticipation.id,
      isExisting: true
    }
  }

  // 3) Crear participación (solo incluir campos que no son undefined)
  const participationData: any = {
    playerId,
    tournamentId: data.tournamentId,
    teamId: data.teamId,
    role: data.role || 'player',
    active: true,
    createdBy: data.createdBy
  }

  // Solo agregar jersey y position si tienen valores definidos
  if (data.jersey !== undefined && data.jersey !== null) {
    participationData.jersey = data.jersey
  }
  if (data.position !== undefined && data.position !== null && data.position !== '') {
    participationData.position = data.position
  }

  const participationId = await createParticipation(participationData)

  console.log(`✅ Participación creada: ${participationId}`)

  return { playerId, participationId, isExisting }
}

/**
 * Lista jugadores de un equipo con sus participaciones
 * Devuelve jugadores con datos combinados de Player + PlayerParticipation
 */
export async function listPlayersWithParticipationsByTeam(teamId: string): Promise<Array<Player & { participation: PlayerParticipation }>> {
  // 1) Obtener participaciones del equipo
  const participations = await listParticipationsByTeam(teamId)

  // 2) Obtener datos de cada jugador
  const players = await Promise.all(
    participations.map(async (participation) => {
      const player = await getPlayer(participation.playerId)
      if (!player) return null

      // Combinar datos del jugador con su participación
      return {
        ...player,
        // Datos de la participación
        participation,
        // Para compatibilidad con código existente
        teamId: participation.teamId,
        tournamentId: participation.tournamentId,
        jersey: participation.jersey,
        position: participation.position,
        role: participation.role,
        active: participation.active
      }
    })
  )

  // Filtrar nulls
  return players.filter(p => p !== null) as Array<Player & { participation: PlayerParticipation }>
}

/**
 * Crea un jugador CON cuenta de Authentication y participación
 * - Crea usuario en Firebase Authentication
 * - Crea documento en users/
 * - Crea documento básico en players/
 * - Crea participación en PlayerParticipations/
 */
export async function createPlayerWithAccountAndParticipation(data: {
  // Datos del jugador
  displayName: string
  email: string
  password?: string
  photoURL?: string | null
  createdBy: string

  // Datos de la participación
  tournamentId: string
  teamId: string
  jersey?: number
  position?: string
  role?: 'player' | 'team' | 'coach'
}): Promise<{ playerId: string; participationId: string; isExisting: boolean }> {
  // Import dinámico para evitar dependencias circulares
  const { createAuthUserAndUserDoc } = await import('./accountService')

  let playerId: string
  let isExisting = false

  // 1) Buscar si existe jugador con ese email
  const existingPlayer = await getPlayerByEmail(data.email)

  if (existingPlayer) {
    playerId = existingPlayer.id
    isExisting = true
    console.log(`✅ Jugador existente encontrado: ${existingPlayer.displayName} (${playerId})`)
  } else {
    // 2) Crear usuario en Authentication y users/
    const uid = await createAuthUserAndUserDoc({
      email: data.email,
      ...(data.password ? { password: data.password } : {}),
      displayName: data.displayName,
      role: 'player',
      ...(data.photoURL !== null && data.photoURL !== undefined ? { photoURL: data.photoURL } : {})
    })

    // 3) Crear documento básico en players/
    const playerData: Partial<Player> = {
      displayName: data.displayName,
      email: data.email,
      createdBy: data.createdBy
    }

    if (data.photoURL !== undefined) {
      playerData.photoURL = data.photoURL
    }

    // Usar el uid como id del jugador
    const ref = doc(colPlayers, uid)
    const dataWithId = {
      ...playerData,
      id: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(ref, dataWithId)
    playerId = uid
    console.log(`✨ Nuevo jugador con cuenta creado: ${data.displayName} (${playerId})`)
  }

  // 4) Verificar si ya tiene participación en este equipo/torneo
  const existingParticipation = await getParticipationByPlayerTeam(
    playerId,
    data.teamId,
    data.tournamentId
  )

  if (existingParticipation) {
    console.log(`⚠️  El jugador ya participa en este equipo/torneo`)
    return {
      playerId,
      participationId: existingParticipation.id,
      isExisting: true
    }
  }

  // 5) Crear participación (solo incluir campos que no son undefined)
  const participationData: any = {
    playerId,
    tournamentId: data.tournamentId,
    teamId: data.teamId,
    role: data.role || 'player',
    active: true,
    createdBy: data.createdBy
  }

  // Solo agregar jersey y position si tienen valores definidos
  if (data.jersey !== undefined && data.jersey !== null) {
    participationData.jersey = data.jersey
  }
  if (data.position !== undefined && data.position !== null && data.position !== '') {
    participationData.position = data.position
  }

  const participationId = await createParticipation(participationData)

  console.log(`✅ Participación creada: ${participationId}`)

  return { playerId, participationId, isExisting }
}
