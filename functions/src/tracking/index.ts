import type { Express } from 'express'
import * as admin from 'firebase-admin'

/**
 * Ruta para servir archivos de player tracking desde Firebase Storage
 * Evita problemas de CORS en desarrollo local
 */
export function trackingRoutes(app: Express) {
  /**
   * GET /tracking/:tournamentId/:matchId
   * Descarga y sirve el archivo player-tracking.json desde Storage
   */
  app.get('/tracking/:tournamentId/:matchId', async (req, res) => {
    try {
      const { tournamentId, matchId } = req.params

      console.log('[Tracking Proxy] Request:', { tournamentId, matchId })

      // Construir path en Storage
      const filePath = `raw/${tournamentId}/${matchId}/player-tracking.json`

      console.log('[Tracking Proxy] Downloading from Storage:', filePath)

      // Obtener archivo de Storage
      const bucket = admin.storage().bucket()
      const file = bucket.file(filePath)

      // Verificar si existe
      const [exists] = await file.exists()
      if (!exists) {
        console.error('[Tracking Proxy] File not found:', filePath)
        return res.status(404).json({
          error: 'Tracking file not found',
          path: filePath
        })
      }

      // Descargar contenido
      const [content] = await file.download()
      const trackingData = JSON.parse(content.toString())

      console.log('[Tracking Proxy] ✅ File served successfully')
      console.log('[Tracking Proxy] Frames:', Object.keys(trackingData).length)

      // Servir con headers CORS correctos
      res.set('Content-Type', 'application/json')
      res.set('Access-Control-Allow-Origin', '*')
      return res.json(trackingData)
    } catch (error) {
      console.error('[Tracking Proxy] Error:', error)
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
