import { db } from 'boot/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { Role } from '@/types/auth'

export async function upsertUserDocMinimal(params: {
  id: string
  displayName: string | null
  email: string | null
  role: Role
  avatar?: string | null
}) {
  const { id, displayName, email, role, avatar = null } = params
  const ref = doc(db, 'users', id)

  await setDoc(ref, {
    id,
    displayName,
    email,
    role,
    avatar,
    registeredAt: serverTimestamp()
  }, { merge: true })
}
