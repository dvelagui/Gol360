/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Script de Migración: Players → PlayerParticipations
 *
 * PROBLEMA:
 * - Jugadores duplicados con mismo email pero diferentes IDs
 * - Cada "jugador" tiene teamId y tournamentId directo
 *
 * SOLUCIÓN:
 * 1. Agrupar jugadores por email
 * 2. Para cada grupo:
 *    - Mantener UN solo Player (el primero o con más datos)
 *    - Crear PlayerParticipation por cada equipo/torneo
 *    - Eliminar Players duplicados
 *
 * CÓMO USAR:
 * 1. Importar en un componente (ej: admin page)
 * 2. Llamar: await migratePlayersToParticipations()
 * 3. Revisar logs en consola
 * 4. Verificar en Firestore
 */

import { db } from '@/boot/firebase'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'
import type { Player } from '@/types/auth'

interface OldPlayer extends Player {
  teamId: string
  tournamentId: string
}

export async function migratePlayersToParticipations(): Promise<void> {
  console.log('🔄 [MIGRACIÓN] Iniciando migración de players → playerParticipations')
  console.log('⏳ Esto puede tomar varios minutos...')

  const playersCol = collection(db, 'players')
  const participationsCol = collection(db, 'playerParticipations')

  // 1) Obtener todos los jugadores
  const snap = await getDocs(playersCol)
  const allPlayers = snap.docs.map(d => ({
    docId: d.id,
    ...(d.data() as any)
  })) as (OldPlayer & { docId: string })[]

  console.log(`📊 Total jugadores encontrados: ${allPlayers.length}`)

  // 2) Agrupar por email
  const byEmail = new Map<string, (OldPlayer & { docId: string })[]>()
  const noEmail: (OldPlayer & { docId: string })[] = []

  allPlayers.forEach(player => {
    if (player.email && player.email.trim() !== '') {
      const email = player.email.toLowerCase().trim()
      if (!byEmail.has(email)) {
        byEmail.set(email, [])
      }
      byEmail.get(email)!.push(player)
    } else {
      noEmail.push(player)
    }
  })

  console.log(`📧 Emails únicos: ${byEmail.size}`)
  console.log(`⚠️  Jugadores sin email: ${noEmail.length}`)

  // 3) Procesar cada grupo de email
  let playersCreated = 0
  let participationsCreated = 0
  let playersDeleted = 0
  let errors = 0

  for (const [email, players] of byEmail.entries()) {
    try {
      if (players.length === 1 && players[0]) {
        // Un solo jugador con este email, migración directa
        const player = players[0]
        await migrateSinglePlayer(player, participationsCol)
        playersCreated++
        participationsCreated++
      } else if (players.length > 1) {
        // Múltiples jugadores con mismo email (DUPLICADOS)
        console.warn(`⚠️  Email duplicado: ${email} (${players.length} jugadores)`)
        players.forEach(p => {
          console.log(`   - ${p.displayName || 'Sin nombre'} (${p.docId}) - Equipo: ${p.teamId}, Torneo: ${p.tournamentId}`)
        })

        // Elegir el jugador "maestro" (el que tenga más datos o el primero)
        const masterPlayer = chooseMasterPlayer(players)
        console.log(`   ✅ Jugador maestro: ${masterPlayer.displayName} (${masterPlayer.docId})`)

        // Crear nuevo Player sin teamId/tournamentId
        const newPlayerId = await createConsolidatedPlayer(masterPlayer)
        playersCreated++

        // Crear participación por cada jugador duplicado
        for (const player of players) {
          await createParticipationFromOldPlayer(player, newPlayerId, participationsCol)
          participationsCreated++

          // Eliminar jugador viejo
          if (player.docId !== masterPlayer.docId) {
            await deleteDoc(doc(playersCol, player.docId))
            playersDeleted++
          }
        }

        // Eliminar el jugador maestro viejo también
        await deleteDoc(doc(playersCol, masterPlayer.docId))
        playersDeleted++
      }
    } catch (error) {
      console.error(`❌ Error procesando email ${email}:`, error)
      errors++
    }
  }

  // 4) Procesar jugadores sin email (crear uno por uno)
  for (const player of noEmail) {
    try {
      await migrateSinglePlayer(player, participationsCol)
      playersCreated++
      participationsCreated++
    } catch (error) {
      console.error(`❌ Error procesando jugador sin email ${player.displayName}:`, error)
      errors++
    }
  }

  // 5) Resumen
  console.log('\n✅ ========== MIGRACIÓN COMPLETADA ==========')
  console.log(`📊 Estadísticas:`)
  console.log(`   - Players creados: ${playersCreated}`)
  console.log(`   - Participaciones creadas: ${participationsCreated}`)
  console.log(`   - Players antiguos eliminados: ${playersDeleted}`)
  console.log(`   - Errores: ${errors}`)
  console.log('===========================================\n')
}

async function migrateSinglePlayer(
  oldPlayer: OldPlayer & { docId: string },
  participationsCol: any
): Promise<void> {
  // Crear nuevo Player (sin teamId/tournamentId)
  const newPlayerId = await createConsolidatedPlayer(oldPlayer)

  // Crear participación
  await createParticipationFromOldPlayer(oldPlayer, newPlayerId, participationsCol)

  // Eliminar player viejo
  await deleteDoc(doc(collection(db, 'players'), oldPlayer.docId))
}

function chooseMasterPlayer(players: (OldPlayer & { docId: string })[]): OldPlayer & { docId: string } {
  // Elegir el que tenga más datos completados
  return players.reduce((best, current) => {
    const bestScore = scorePlayer(best)
    const currentScore = scorePlayer(current)
    return currentScore > bestScore ? current : best
  })
}

function scorePlayer(player: OldPlayer): number {
  let score = 0
  if (player.displayName) score += 10
  if (player.email) score += 10
  if (player.photoURL) score += 5
  if (player.position) score += 3
  if (player.jersey) score += 3
  return score
}

async function createConsolidatedPlayer(oldPlayer: OldPlayer): Promise<string> {
  const playersCol = collection(db, 'players')
  const newPlayerRef = doc(playersCol)

  const newPlayer: any = {
    id: newPlayerRef.id,
    displayName: oldPlayer.displayName || 'Jugador',
    createdBy: oldPlayer.createdBy || '',
    createdAt: oldPlayer.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  // Solo agregar campos si tienen valor (no undefined)
  if (oldPlayer.email && oldPlayer.email.trim() !== '') {
    newPlayer.email = oldPlayer.email.trim()
  }
  if (oldPlayer.photoURL && oldPlayer.photoURL.trim() !== '') {
    newPlayer.photoURL = oldPlayer.photoURL.trim()
  }

  await setDoc(newPlayerRef, newPlayer)
  console.log(`   ✨ Nuevo Player creado: ${newPlayer.id}`)
  return newPlayerRef.id
}

async function createParticipationFromOldPlayer(
  oldPlayer: OldPlayer & { docId: string },
  newPlayerId: string,
  participationsCol: any
): Promise<void> {
  const participationRef = doc(participationsCol)

  const participation: any = {
    id: participationRef.id,
    playerId: newPlayerId,
    tournamentId: oldPlayer.tournamentId || '',
    teamId: oldPlayer.teamId || '',
    role: (oldPlayer.role as 'player' | 'team') || 'player',
    active: oldPlayer.active !== undefined ? oldPlayer.active : true,
    joinedAt: oldPlayer.createdAt || serverTimestamp(),
    createdBy: oldPlayer.createdBy || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  // Solo agregar campos opcionales si tienen valor
  if (oldPlayer.jersey !== undefined && oldPlayer.jersey !== null) {
    participation.jersey = oldPlayer.jersey
  }
  if (oldPlayer.position && oldPlayer.position.trim() !== '') {
    participation.position = oldPlayer.position.trim()
  }

  await setDoc(participationRef, participation)
  console.log(`   📝 Participación creada: Equipo ${participation.teamId}, Torneo ${participation.tournamentId}`)
}

/**
 * MODO DRY-RUN: Simula la migración sin modificar datos
 */
export async function dryRunMigration(): Promise<void> {
  console.log('🔍 [DRY RUN] Analizando datos sin modificar...')

  const playersCol = collection(db, 'players')
  const snap = await getDocs(playersCol)
  const allPlayers = snap.docs.map(d => ({
    docId: d.id,
    ...(d.data() as any)
  })) as (OldPlayer & { docId: string })[]

  const byEmail = new Map<string, (OldPlayer & { docId: string })[]>()
  const noEmail: (OldPlayer & { docId: string })[] = []

  allPlayers.forEach(player => {
    if (player.email && player.email.trim() !== '') {
      const email = player.email.toLowerCase().trim()
      if (!byEmail.has(email)) {
        byEmail.set(email, [])
      }
      byEmail.get(email)!.push(player)
    } else {
      noEmail.push(player)
    }
  })

  console.log(`\n📊 ANÁLISIS:`)
  console.log(`   Total jugadores: ${allPlayers.length}`)
  console.log(`   Emails únicos: ${byEmail.size}`)
  console.log(`   Sin email: ${noEmail.length}`)

  let duplicates = 0
  byEmail.forEach((players, email) => {
    if (players.length > 1) {
      duplicates++
      console.warn(`\n⚠️  Email duplicado: ${email} (${players.length} jugadores)`)
      players.forEach(p => {
        console.log(`   - ${p.displayName || 'Sin nombre'} (ID: ${p.id})`)
        console.log(`     Equipo: ${p.teamId}, Torneo: ${p.tournamentId}`)
      })
    }
  })

  console.log(`\n📊 RESULTADO:`)
  console.log(`   - Emails con duplicados: ${duplicates}`)
  console.log(`   - Players que se crearán: ${byEmail.size + noEmail.length}`)
  console.log(`   - Participaciones que se crearán: ${allPlayers.length}`)
  console.log(`   - Players que se eliminarán: ${allPlayers.length}`)
  console.log(`\n✅ Dry run completado. No se modificaron datos.`)
}
