/**
 * Servicio para manejar operaciones con Google Cloud Storage
 * y conversión de URLs gs:// a HTTPS
 */
class StorageService {
  /**
   * Convierte una URL de formato gs:// a una URL HTTPS descargable
   * @param gsUrl - URL en formato gs://bucket/path/to/file.png
   * @returns URL HTTPS pública para descargar/mostrar el archivo
   * @example
   * // Input: gs://gol360-app.firebasestorage.app/raw/T97S5C/Arsenal/shot_map.png
   * // Output: https://firebasestorage.googleapis.com/v0/b/gol360-app.firebasestorage.app/o/raw%2FT97S5C%2FArsenal%2Fshot_map.png?alt=media
   */
  convertGsUrlToHttps(gsUrl: string): string {
    // Validar que sea una URL de gs://
    if (!gsUrl.startsWith('gs://')) {
      throw new Error('Invalid gs:// URL format')
    }

    // Extraer bucket y path: gs://bucket/path/to/file.png
    const withoutProtocol = gsUrl.replace('gs://', '')
    const firstSlashIndex = withoutProtocol.indexOf('/')

    if (firstSlashIndex === -1) {
      throw new Error('Invalid gs:// URL: no path after bucket')
    }

    const bucket = withoutProtocol.substring(0, firstSlashIndex)
    const path = withoutProtocol.substring(firstSlashIndex + 1)

    // Encode el path para la URL
    const encodedPath = encodeURIComponent(path)

    // Formato de Firebase Storage API
    const httpsUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`

    return httpsUrl
  }

  /**
   * Convierte múltiples URLs gs:// a HTTPS en paralelo
   * @param gsUrls - Array de URLs en formato gs://
   * @returns Array de URLs HTTPS
   */
  async convertMultipleGsUrls(gsUrls: string[]): Promise<string[]> {
    const promises = gsUrls.map(url => this.convertGsUrlToHttps(url))
    return Promise.all(promises)
  }

  /**
   * Verifica si una URL es del formato gs://
   * @param url - URL a verificar
   * @returns true si es formato gs://
   */
  isGsUrl(url: string): boolean {
    return url.startsWith('gs://')
  }

  /**
   * Convierte URL solo si es necesario (si es gs://)
   * Si ya es HTTPS, la retorna sin cambios
   * @param url - URL a procesar
   * @returns URL HTTPS
   */
  ensureHttpsUrl(url: string): string {
    if (this.isGsUrl(url)) {
      return this.convertGsUrlToHttps(url)
    }
    return url
  }
}

export default new StorageService()
