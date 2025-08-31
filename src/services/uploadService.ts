// Servicio de subida genérico para Storage
// Reutilizable para equipos, usuarios, managers, jugadores, etc.
import {  ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {storage} from '@/boot/firebase' // asegúrate que exportas "firebaseApp" desde tu boot

type Folder =
  | 'teams'
  | 'users'
  | 'players'
  | 'managers'
  | 'avatars'
  | 'misc'

/**
 * Sube un archivo a Firebase Storage y devuelve su downloadURL.
 * No construyas URLs a mano: deja que el SDK gestione bucket/host.
 */
export async function uploadImage(
  file: File,
  folder: Folder = 'misc',
  opts?: { filename?: string }
): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error('uploadImage: "file" debe ser un File válido')
  }
 // usa el bucket de tu config
  const safeName = (opts?.filename ?? file.name).replace(/\s+/g, '_')
  const key = `${folder}/${Date.now()}_${safeName}`

  const objectRef = ref(storage, key)
  // Sube con el contentType del archivo
  await uploadBytes(objectRef, file, { contentType: file.type || undefined })
  // Obtiene la URL pública con token
  return await getDownloadURL(objectRef)
}
