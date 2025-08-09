import { auth, db, storage } from 'boot/firebase'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export async function updateDisplayName(uid: string, displayName: string) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error('No auth user')
  await updateAuthProfile(auth.currentUser, { displayName })
  await updateDoc(doc(db, 'users', uid), { displayName })
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const ref = storageRef(storage, `avatars/${uid}.jpg`)
  await uploadBytes(ref, file)
  const url = await getDownloadURL(ref)
  await updateDoc(doc(db, 'users', uid), { avatar: url })
  return url
}
