import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export type UploadResult = { url: string; path: string }

function cleanFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 80)
}

/**
 * Sube una imagen a Firebase Storage.
 * - folder: carpeta lógica (p.ej. 'teams', 'users', 'players', 'misc')
 * - filename: opcional; si no, se genera con timestamp
 * - replacePath: si se pasa, intentará borrar ese objeto tras subir el nuevo
 */
export async function uploadImage(
  file: File,
  opts: { folder: string; filename?: string; replacePath?: string }
): Promise<UploadResult> {
  const storage = getStorage()
  const safeName = cleanFilename(opts.filename ?? file.name ?? 'image')
  const stamp = Date.now()
  const path = `${opts.folder}/${stamp}_${safeName}`

  const ref = storageRef(storage, path)
  await uploadBytes(ref, file, { contentType: file.type })
  const url = await getDownloadURL(ref)

  // Si se indica replacePath, intentamos eliminar el anterior (best-effort)
  if (opts.replacePath && opts.replacePath !== path) {
    try {
      const oldRef = storageRef(storage, opts.replacePath)
      await deleteObject(oldRef)
    } catch {
      /* no-op */
    }
  }

  return { url, path }
}
