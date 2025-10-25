/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  type Query
} from 'firebase/firestore'
import { colContactMessages } from './firestore/collections'

export interface ContactMessage {
  id?: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'pending' | 'read' | 'replied'
  createdAt: string
  updatedAt?: string
  repliedAt?: string
  adminNotes?: string
}

/**
 * Crea un nuevo mensaje de contacto
 */
export async function createContactMessage(
  payload: Omit<ContactMessage, 'id'>
): Promise<string> {
  const ref = doc(colContactMessages) // id auto
  const data: any = {
    id: ref.id,
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    status: payload.status || 'pending',
    createdAt: serverTimestamp()
  }

  // Solo agregar phone si tiene valor
  if (payload.phone !== undefined && payload.phone !== null && payload.phone !== '') {
    data.phone = payload.phone
  }

  await setDoc(ref, data)
  return ref.id
}

/**
 * Obtiene un mensaje por id
 */
export async function getContactMessage(id: string): Promise<ContactMessage | null> {
  const snap = await getDoc(doc(colContactMessages, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ContactMessage) : null
}

/**
 * Lista todos los mensajes de contacto ordenados por fecha
 */
export async function listContactMessages(): Promise<ContactMessage[]> {
  const q: Query = query(
    colContactMessages,
    orderBy('createdAt', 'desc')
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage))
}

/**
 * Lista mensajes por estado
 */
export async function listContactMessagesByStatus(status: 'pending' | 'read' | 'replied'): Promise<ContactMessage[]> {
  const q: Query = query(
    colContactMessages,
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  )
  const snaps = await getDocs(q)
  return snaps.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage))
}

/**
 * Actualiza el estado de un mensaje
 */
export async function updateContactMessageStatus(
  id: string,
  status: 'pending' | 'read' | 'replied'
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: serverTimestamp()
  }

  if (status === 'replied') {
    updateData.repliedAt = serverTimestamp()
  }

  await updateDoc(doc(colContactMessages, id), updateData)
}

/**
 * Actualiza las notas del admin en un mensaje
 */
export async function updateContactMessageNotes(
  id: string,
  adminNotes: string
): Promise<void> {
  await updateDoc(doc(colContactMessages, id), {
    adminNotes,
    updatedAt: serverTimestamp()
  } as any)
}

/**
 * Elimina un mensaje de contacto
 */
export async function deleteContactMessage(id: string): Promise<void> {
  await deleteDoc(doc(colContactMessages, id))
}

// Export default service object
export default {
  createContactMessage,
  getContactMessage,
  listContactMessages,
  listContactMessagesByStatus,
  updateContactMessageStatus,
  updateContactMessageNotes,
  deleteContactMessage
}
