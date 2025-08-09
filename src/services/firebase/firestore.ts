import { db } from 'boot/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { AppRole } from '@/types/auth'

export async function upsertUserDocMinimal(params: {
  uid: string
  displayName: string | null
  email: string | null
  role: AppRole
  avatar?: string | null
}) {
  const { uid, displayName, email, role, avatar = null } = params
  const ref = doc(db, 'users', uid)

  await setDoc(ref, {
    uid,
    displayName,
    email,
    role,
    avatar,
    registeredAt: serverTimestamp()
  }, { merge: true })
}
