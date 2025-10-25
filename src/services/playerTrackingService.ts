/**
 * Servicio para manejar Player Tracking data
 * Path: src/services/playerTrackingService.ts
 */

import { db, storage } from '@/boot/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { ref as storageRef, getDownloadURL } from 'firebase/storage'

// ============================================
// INTERFACES
// ============================================

/**
 * Metadata del tracking almacenada en Firestore
 * Path: tournaments/{tournamentId}/matches/{matchId}/tracking/metadata
 */
export interface TrackingMetadata {
  gcsPath: string
  signedUrl: string
  fileSizeBytes: number
  fileSizeMB: number
  urlExpiresAt: Date
  updatedAt: Date
}

/**
 * Posición de un jugador en un frame específico
 */
export interface PlayerPosition {
  x: number // Coordenada X normalizada (0-1)
  y: number // Coordenada Y normalizada (0-1)
  jersey?: string // Número de camiseta o "Portero"
  team?: string // "home" o "away"
}

/**
 * Frame de tracking con todos los jugadores
 * Key: playerId (ej: "goalie_left", "1_left", "goalie_right", etc.)
 */
export interface TrackingFrame {
  [playerId: string]: PlayerPosition
}

/**
 * Datos completos de tracking
 * Key: frame number (0, 1, 2, ..., 5378)
 */
export interface PlayerTrackingData {
  [frameNumber: string]: TrackingFrame
}

// ============================================
// SERVICE CLASS
// ============================================

class PlayerTrackingService {
  // Cache para las keys ordenadas del tracking data
  private sortedKeysCache: number[] | null = null
  private trackingDataCache: PlayerTrackingData | null = null

  /**
   * Obtiene la metadata del tracking desde Firestore
   */
  async getTrackingMetadata(
    tournamentId: string,
    matchId: string
  ): Promise<TrackingMetadata | null> {
    try {
      console.log('[PlayerTrackingService] Fetching tracking metadata:', {
        tournamentId,
        matchId
      })

      const trackingRef = doc(
        db,
        'tournaments',
        tournamentId,
        'matches',
        matchId,
        'tracking',
        'metadata'
      )

      const trackingDoc = await getDoc(trackingRef)

      if (!trackingDoc.exists()) {
        console.warn('[PlayerTrackingService] Tracking metadata not found')
        return null
      }

      const data = trackingDoc.data() as TrackingMetadata
      console.log('[PlayerTrackingService] Metadata found:', {
        fileSizeMB: data.fileSizeMB,
        urlExpiresAt: data.urlExpiresAt
      })

      return data
    } catch (error) {
      console.error('[PlayerTrackingService] Error fetching metadata:', error)
      throw error
    }
  }

  /**
   * Descarga el archivo JSON de tracking desde Firebase Storage usando el SDK
   * IMPORTANTE: Este archivo es de ~5MB, solo descargar cuando sea necesario
   * Usa Firebase Storage SDK que maneja CORS automáticamente
   */
  async downloadTrackingDataFromPath(
    tournamentId: string,
    matchId: string
  ): Promise<PlayerTrackingData | null> {
    try {
      console.log('[PlayerTrackingService] Downloading tracking data from Storage...')

      // Construir path en Storage: raw/{tournamentId}/{matchId}/player-tracking.json
      const path = `raw/${tournamentId}/${matchId}/player-tracking.json`
      console.log('[PlayerTrackingService] Storage path:', path)

      // Obtener referencia al archivo
      const fileRef = storageRef(storage, path)

      // Obtener URL de descarga
      const downloadUrl = await getDownloadURL(fileRef)
      console.log('[PlayerTrackingService] Download URL obtained')

      // Descargar usando fetch con la URL de Firebase Storage
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const trackingData: PlayerTrackingData = await response.json()

      const frameCount = Object.keys(trackingData).length
      console.log(`[PlayerTrackingService] ✅ Tracking data downloaded: ${frameCount} frames`)

      return trackingData
    } catch (error) {
      console.error('[PlayerTrackingService] Error downloading tracking data:', error)
      throw error
    }
  }

  /**
   * Descarga el archivo JSON de tracking a través de Cloud Function proxy
   * IMPORTANTE: Este método evita problemas de CORS en desarrollo local
   * Usa la Cloud Function /api/tracking/:tournamentId/:matchId como proxy
   */
  async downloadTrackingDataViaProxy(
    tournamentId: string,
    matchId: string
  ): Promise<PlayerTrackingData | null> {
    try {
      console.log('[PlayerTrackingService] Downloading via Cloud Function proxy...')

      // URL de la Cloud Function
      const functionUrl = import.meta.env.DEV
        ? `http://127.0.0.1:5001/gol360-app/us-central1/api/tracking/${tournamentId}/${matchId}`
        : `/api/tracking/${tournamentId}/${matchId}`

      console.log('[PlayerTrackingService] Proxy URL:', functionUrl)

      const response = await fetch(functionUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const trackingData: PlayerTrackingData = await response.json()

      const frameCount = Object.keys(trackingData).length
      console.log(`[PlayerTrackingService] ✅ Tracking data downloaded via proxy: ${frameCount} frames`)

      return trackingData
    } catch (error) {
      console.error('[PlayerTrackingService] Error downloading via proxy:', error)
      throw error
    }
  }

  /**
   * Descarga el archivo JSON de tracking desde la URL firmada (método alternativo)
   * IMPORTANTE: Este archivo es de ~5MB, solo descargar cuando sea necesario
   * NOTA: Puede tener problemas de CORS en desarrollo
   */
  async downloadTrackingData(signedUrl: string): Promise<PlayerTrackingData | null> {
    try {
      console.log('[PlayerTrackingService] Downloading tracking data...')
      console.log('[PlayerTrackingService] URL:', signedUrl.substring(0, 100) + '...')

      const response = await fetch(signedUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const trackingData: PlayerTrackingData = await response.json()

      const frameCount = Object.keys(trackingData).length
      console.log(`[PlayerTrackingService] ✅ Tracking data downloaded: ${frameCount} frames`)

      return trackingData
    } catch (error) {
      console.error('[PlayerTrackingService] Error downloading tracking data:', error)
      throw error
    }
  }

  /**
   * Verifica si la URL firmada ha expirado
   */
  isUrlExpired(urlExpiresAt: Date): boolean {
    return new Date() > new Date(urlExpiresAt)
  }

  /**
   * Obtiene el frame de tracking para un segundo específico del partido
   * @param trackingData - Datos completos de tracking
   * @param frameNumber - Número de frame (segundo del partido)
   */
  getFrameData(
    trackingData: PlayerTrackingData,
    frameNumber: number
  ): TrackingFrame | null {
    // Cachear las keys ordenadas para búsqueda rápida
    if (!this.sortedKeysCache || this.trackingDataCache !== trackingData) {
      this.sortedKeysCache = Object.keys(trackingData)
        .map(k => parseFloat(k))
        .sort((a, b) => a - b)
      this.trackingDataCache = trackingData
      console.log('[PlayerTrackingService] Keys cached:', this.sortedKeysCache.length)
    }

    // Búsqueda binaria para encontrar el frame más cercano
    let left = 0
    let right = this.sortedKeysCache.length - 1
    let closestKey = this.sortedKeysCache[0]

    if (closestKey === undefined) {
      console.warn('[PlayerTrackingService] No frames available')
      return null
    }

    let minDiff = Math.abs(closestKey - frameNumber)

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midKey = this.sortedKeysCache[mid]

      if (midKey === undefined) {
        break
      }

      const diff = Math.abs(midKey - frameNumber)

      if (diff < minDiff) {
        minDiff = diff
        closestKey = midKey
      }

      if (midKey === frameNumber) {
        // Coincidencia exacta
        break
      } else if (midKey < frameNumber) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    // Convertir el número de vuelta a string para buscar en el objeto
    // Buscar con diferentes formatos: "2603", "2603.0", "2603.4"
    const keyStr = closestKey.toString()
    return trackingData[keyStr] || null
  }
}

// Exportar singleton
export default new PlayerTrackingService()
