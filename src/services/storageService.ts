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
   * // Input: gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_1st_period.png
   * // Output: https://storage.googleapis.com/gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_1st_period.png
   */
  async convertGsUrlToHttps(gsUrl: string): Promise<string> {
    // Validar que sea una URL de gs://
    if (!gsUrl.startsWith('gs://')) {
      throw new Error('Invalid gs:// URL format')
    }

    // Conversión simple: reemplazar gs:// por https://storage.googleapis.com/
    const httpsUrl = gsUrl.replace('gs://', 'https://storage.googleapis.com/')

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
  async ensureHttpsUrl(url: string): Promise<string> {
    if (this.isGsUrl(url)) {
      return this.convertGsUrlToHttps(url)
    }
    return url
  }
}

export default new StorageService()
