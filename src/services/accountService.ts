/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/boot/firebase'
import { getSecondaryAuth } from '@/boot/firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth'
import {
  doc, setDoc, serverTimestamp
} from 'firebase/firestore'

type CommonUserDoc = {
  id: string
  displayName: string
  email: string
  role: 'admin' | 'manager' | 'team' | 'player'
  avatar?: string
  photoURL?: string
  createdAt?: any
}

const DEFAULT_AVATAR =
  'https://firebasestorage.googleapis.com/v0/b/gol360-app.firebasestorage.app/o/avatar%2Fplayer.png?alt=media&token=0175081b-9761-4acb-9e15-a77baf10b7f0'

/**
 * Crea un usuario en Authentication usando la instancia secundaria (no afecta la sesión actual),
 * setea displayName, y escribe el doc en users/{uid} con el role indicado.
 * Devuelve el uid.
 */
export async function createAuthUserAndUserDoc(params: {
  email: string
  password?: string   // por defecto '12345'
  displayName: string
  role: 'manager' | 'player' | 'team' | 'admin'
  photoURL?: string
}): Promise<string> {
  const { email, displayName, role } = params
  const photoURL = params.photoURL ?? DEFAULT_AVATAR
  const password = params.password ?? '123456'

  const secondaryAuth = getSecondaryAuth()

  // 1) crear en Auth usando el auth secundario
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  await updateProfile(cred.user, { displayName, photoURL })

  // 2) users/{uid}
  const userDoc: CommonUserDoc = {
    id: cred.user.uid,
    displayName,
    email,
    role,
    avatar: photoURL,
    photoURL,
    createdAt: serverTimestamp()
  }
  await setDoc(doc(db, 'users', cred.user.uid), userDoc as any)

  // 3) cerrar sesión en el auth secundario para no tocar la sesión actual
  await signOut(secondaryAuth)

  return cred.user.uid
}

/** Crea manager con Authentication + colecciones users/{uid} y managers/{uid} */
export async function createManagerWithAccount(payload: {
  fullName: string
  email: string
  docType: 'CC' | 'TI' | 'TE'
  docNumber: string
  organization?: string
  phone?: string
  photoURL?: string
}): Promise<string> {
  const uid = await createAuthUserAndUserDoc({
    email: payload.email,
    displayName: payload.fullName,
    role: 'manager',
    ...(payload.photoURL !== undefined ? { photoURL: payload.photoURL } : {})
  })

  await setDoc(doc(db, 'managers', uid), {
    id: uid,
    displayName: payload.fullName,
    email: payload.email,
    docType: payload.docType,
    docNumber: payload.docNumber,
    organization: payload.organization ?? '',
    phone: payload.phone ?? '',
    createdAt: serverTimestamp()
  } as any)

  return uid
}

/** (Listo para más adelante) Crea player con Authentication + users/{uid} y players/{uid} */
export async function createPlayerWithAccount(payload: {
  fullName: string
  email: string
  teamId: string
  tournamentId: string
  jersey?: number
  position?: string
  photoURL?: string
}): Promise<string> {
  const uid = await createAuthUserAndUserDoc({
    email: payload.email,
    displayName: payload.fullName,
    role: 'player',
    ...(payload.photoURL !== undefined ? { photoURL: payload.photoURL } : {})
  })

  await setDoc(doc(db, 'players', uid), {
    id: uid,
    displayName: payload.fullName,
    email: payload.email,
    teamId: payload.teamId,
    tournamentId: payload.tournamentId,
    jersey: payload.jersey ?? 0,
    position: payload.position ?? '',
    role: 'player',
    active: true,
    createdAt: serverTimestamp()
  } as any)

  return uid
}
