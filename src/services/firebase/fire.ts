/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/boot/firebase'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'

export const col = (path: string) => collection(db, path)
export const ref = (path: string, id: string) => doc(db, path, id)

export async function listDocs<T>(path: string, order: string = 'createdAt') {
  const q = query(col(path), orderBy(order, 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

export const createDoc = (path: string, data: any) => addDoc(col(path), data)
export const updateDocById = (path: string, id: string, data: any) => updateDoc(ref(path, id), data)
export const deleteDocById = (path: string, id: string) => deleteDoc(ref(path, id))
