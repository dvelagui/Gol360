// src/services/firestore/collections.ts
import { db } from 'boot/firebase'
import { collection } from 'firebase/firestore'

export const colTournaments = collection(db, 'tournaments')
export const colTeams       = collection(db, 'teams')
export const colPlayers     = collection(db, 'players')
export const colManagers  = collection(db, 'managers')
export const colAdmins       = collection(db, 'users')
