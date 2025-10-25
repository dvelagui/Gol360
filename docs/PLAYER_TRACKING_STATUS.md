# Player Tracking Feature - Status Report

**Fecha:** 2025-10-24
**Proyecto:** GOL360 - Panel de Destacados
**Feature:** Player Tracking Visualization

---

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de visualización de tracking de jugadores sobre videos de YouTube en el Panel de Destacados. El sistema descarga datos de posicionamiento de jugadores desde Firebase Storage y los visualiza en tiempo real sincronizados con el video.

---

## ✅ Componentes Completados

### 1. Backend - Cloud Functions (`functions/src/tracking/`)

**Archivo:** `functions/src/tracking/index.ts`

**Estado:** ✅ **COMPLETADO Y FUNCIONAL**

**Funcionalidad:**
- Proxy HTTP para servir archivos `player-tracking.json` desde Firebase Storage
- Resuelve problemas de CORS en desarrollo local
- Endpoint: `GET /tracking/:tournamentId/:matchId`
- Verifica existencia del archivo antes de servir
- Manejo de errores robusto
- Headers CORS configurados correctamente

**Path de datos en Storage:**
```
raw/{tournamentId}/{matchId}/player-tracking.json
```

**Integración:**
- ✅ Rutas registradas en `functions/src/index.ts` (línea 8, 22)
- ✅ Express app configurado con CORS

---

### 2. Frontend Service (`src/services/playerTrackingService.ts`)

**Estado:** ✅ **COMPLETADO Y FUNCIONAL**

**Características implementadas:**

#### Interfaces TypeScript
```typescript
- TrackingMetadata: Metadata almacenada en Firestore
- PlayerPosition: Posición de jugador (x, y, jersey, team)
- TrackingFrame: Frame con todos los jugadores
- PlayerTrackingData: Datos completos indexados por frame number
```

#### Métodos principales

1. **`getTrackingMetadata(tournamentId, matchId)`**
   - Obtiene metadata desde Firestore
   - Path: `tournaments/{tournamentId}/matches/{matchId}/tracking/metadata`
   - Retorna: `TrackingMetadata | null`

2. **`downloadTrackingDataFromPath(tournamentId, matchId)`** ✅ RECOMENDADO
   - Descarga usando Firebase Storage SDK
   - Maneja CORS automáticamente
   - Obtiene download URL del Storage
   - ~5MB de datos JSON

3. **`downloadTrackingDataViaProxy(tournamentId, matchId)`** ✅ ACTUALMENTE EN USO
   - Descarga a través de Cloud Function proxy
   - Evita problemas de CORS en desarrollo
   - URLs:
     - Dev: `http://127.0.0.1:5001/gol360-app/us-central1/api/tracking/{tournamentId}/{matchId}`
     - Prod: `/api/tracking/{tournamentId}/{matchId}`

4. **`downloadTrackingData(signedUrl)`**
   - Método alternativo usando signed URL
   - Puede tener problemas de CORS

5. **`getFrameData(trackingData, frameNumber)`**
   - Búsqueda binaria optimizada de frames
   - Cache de keys ordenadas
   - Encuentra el frame más cercano al número solicitado
   - Performance: O(log n)

#### Optimizaciones
- ✅ Cache de keys ordenadas para búsqueda rápida
- ✅ Búsqueda binaria para encontrar frames
- ✅ Logging detallado para debugging

---

### 3. UI Component - DestacadosPanel (`src/components/tournaments/panels/DestacadosPanel.vue`)

**Estado:** ✅ **COMPLETADO Y FUNCIONAL**

**Secciones del componente:**

#### A. Props recibidos
```typescript
- playerMomentsData: PlayerMomentsData[] - Datos de momentos por jugador
- youtubeVideoId: string - ID del video de YouTube
- matchStart: string - Tiempo de inicio del partido en el video (MM:SS)
- tournamentId: string - ID del torneo
- matchId: string - ID del partido
- loading: boolean - Estado de carga
```

#### B. State de Tracking
```typescript
- trackingData: PlayerTrackingData | null - Datos de tracking descargados (~5MB)
- isLoadingTracking: boolean - Estado de descarga
- showTracking: boolean - Toggle de visualización
- canvasWidth: number - Ancho del canvas (1280px por defecto)
- canvasHeight: number - Alto del canvas (720px por defecto)
- currentVideoTime: number - Tiempo actual del video en segundos
```

#### C. YouTube Player Integration
- ✅ YouTube IFrame API inicializado
- ✅ Player creado dinámicamente en `youtubePlayerDiv`
- ✅ Eventos: `onReady`, `onStateChange`
- ✅ Métodos: `seekTo()`, `playVideo()`, `pauseVideo()`, `getCurrentTime()`
- ✅ Tracking de tiempo del video cada 100ms cuando está reproduciendo

#### D. Canvas Overlay
**Template (líneas 129-136):**
```vue
<canvas
  v-if="showTracking && trackingData"
  ref="trackingCanvas"
  class="tracking-canvas"
  :width="canvasWidth"
  :height="canvasHeight"
></canvas>
```

**CSS (líneas 1170-1178):**
```scss
.tracking-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* No bloquea clics en el video */
  z-index: 2; /* Sobre el video */
}
```

#### E. Funciones de Tracking

1. **`loadTrackingData()`** (líneas 621-676)
   - ✅ Descarga datos usando `downloadTrackingDataViaProxy()`
   - ✅ Guarda en `trackingData.value`
   - ✅ Activa `showTracking` automáticamente
   - ✅ Logging detallado de frames
   - ✅ Manejo de errores con instrucciones

2. **`resizeCanvas()`** (líneas 680-692)
   - ✅ Ajusta canvas al tamaño del video wrapper
   - ✅ Listener en window resize
   - ✅ Mantiene aspect ratio

3. **`drawTracking()`** (líneas 697-823) ⚠️ **FUNCIONAL PERO NECESITA AJUSTES**
   - ✅ Limpia canvas en cada frame
   - ✅ DEBUG: Dibuja rectángulo rojo de prueba
   - ✅ Calcula frame actual basado en tiempo de video
   - ✅ Obtiene datos del frame usando `getFrameData()`
   - ✅ Convierte coordenadas de metros a píxeles
   - ✅ Dibuja círculos para cada jugador
   - ✅ Colores por equipo (rojo/azul)
   - ✅ Resalta jugador seleccionado (amarillo, círculo grande)
   - ✅ Muestra número de camiseta

4. **`isPlayerSelectedByName(playerName)`** (líneas 828-855)
   - ✅ Compara nombre del tracking con jugador seleccionado
   - ✅ Búsqueda por nombre (case insensitive)
   - ✅ Búsqueda por número de camiseta
   - ✅ Maneja diferentes formatos: "Arsenal_11", "Portero", "Camisetan.º11"

5. **`updateVideoTime()`** (líneas 859-873)
   - ✅ Obtiene tiempo actual de YouTube Player
   - ✅ Actualiza `currentVideoTime.value`
   - ✅ Manejo de errores

6. **`startVideoTimeTracking()` / `stopVideoTimeTracking()`** (líneas 983-1003)
   - ✅ Interval de 100ms para sincronización fluida
   - ✅ Actualiza tiempo y redibuja canvas
   - ✅ Solo cuando video está reproduciendo

#### F. UI Controls
**Líneas 96-116:**
```vue
<!-- Botón para cargar tracking -->
<q-btn
  v-if="!trackingData"
  outline
  color="secondary"
  icon="download"
  label="Cargar Tracking"
  :loading="isLoadingTracking"
  @click="loadTrackingData"
/>

<!-- Toggle para mostrar/ocultar tracking -->
<q-toggle
  v-else
  v-model="showTracking"
  color="secondary"
  icon="visibility"
  label="Tracking"
/>
```

#### G. Lifecycle Hooks
- ✅ `onMounted()`: Inicializa canvas, YouTube Player, window resize listener
- ✅ `onBeforeUnmount()`: Limpia intervals, listeners, destruye YouTube Player

---

### 4. Page Integration (`src/pages/tournaments/TournamentStats.vue`)

**Estado:** ✅ **COMPLETADO**

**Props pasados a DestacadosPanel (líneas 103-110):**
```vue
<DestacadosPanel
  :player-moments-data="playerMomentsData"
  :youtube-video-id="youtubeVideoId"
  :match-start="matchStart"
  :tournament-id="selectedMatch?.tournamentId || ''"
  :match-id="selectedMatch?.matchId || ''"
  :loading="isLoadingAnalytics"
/>
```

**Datos cargados desde Firestore:**
- ✅ `youtubeVideoId` - Desde `matchMetadata.VIDEO_ID` (línea 256-263)
- ✅ `matchStart` - Desde `matchMetadata.MATCH_START` (línea 265-272)
- ✅ `playerMomentsData` - Filtrado por rol de usuario (línea 176-179, 340-363)

---

## 🎯 Estado Actual del Sistema

### Lo que FUNCIONA ✅

1. **Backend proxy**: Sirve archivos JSON sin problemas de CORS
2. **Descarga de datos**: ~5MB de tracking data se descarga correctamente
3. **Canvas overlay**: Se renderiza sobre el video de YouTube
4. **Sincronización**: Tiempo de video se actualiza cada 100ms
5. **Conversión de coordenadas**: Metros → Píxeles funciona
6. **Dibujado de jugadores**: Círculos aparecen en el canvas
7. **Colores por equipo**: Rojo (home) / Azul (away)
8. **Jugador seleccionado**: Se resalta en amarillo con círculo grande
9. **Número de camiseta**: Se muestra en cada círculo

### Problema Actual 🚨

**Síntoma:**
> "Aparecen unos puntos por todos lados rojos azules y un amarillo grande"

**Diagnóstico:**

El sistema está dibujando correctamente, pero las **posiciones NO coinciden** con las posiciones reales de los jugadores en el video.

**Posibles causas:**

1. **Formato de datos incorrecto**
   - Línea 764: `const [playerName, jersey, xMeters, yMeters] = playerData`
   - Asume estructura: `[nombre, jersey, x, y]`
   - ⚠️ **NECESITA VERIFICACIÓN**: ¿Es esta la estructura real del JSON?

2. **Sistema de coordenadas incorrecto**
   - Líneas 755-757: Asume campo de 105m x 68m
   - Asume (0,0) en el centro del campo
   - Asume rango: x: [-52.5, 52.5], y: [-34, 34]
   - ⚠️ **NECESITA VERIFICACIÓN**: ¿Es este el sistema de coordenadas correcto?

3. **Aspecto ratio del canvas vs video**
   - Canvas: 16:9 (línea 1151)
   - Video: 16:9 (YouTube estándar)
   - ⚠️ Puede haber desajuste si el video tiene letterboxing

4. **Offset del frame incorrecto**
   - Línea 732: `const currentFrame = Math.floor(currentVideoTime.value - matchStartSeconds)`
   - ⚠️ **NECESITA VERIFICACIÓN**: ¿Los frames del tracking empiezan en 0 desde el inicio del partido?

---

## 🔧 Tareas Pendientes

### CRÍTICO 🔴 - Necesario para funcionalidad básica

1. **[ ] Verificar estructura real del JSON de tracking**
   - Inspeccionar archivo: `raw/{tournamentId}/{matchId}/player-tracking.json`
   - Documentar estructura exacta
   - Ejemplo esperado:
     ```json
     {
       "0": {
         "player_1": [...],
         "player_2": [...]
       }
     }
     ```
   - Ajustar parsing en `drawTracking()` si es necesario

2. **[ ] Verificar sistema de coordenadas**
   - ¿Las coordenadas están en metros o normalizadas (0-1)?
   - ¿Cuál es el origen (0,0)?
   - ¿Cuál es el rango de valores?
   - ¿Qué representa cada eje (X=largo, Y=ancho)?

3. **[ ] Calibrar conversión de coordenadas**
   - Probar con un jugador conocido en un momento específico
   - Comparar posición visual en video vs posición dibujada
   - Ajustar fórmula de conversión (líneas 769-773)

4. **[ ] Verificar sincronización frame-video**
   - Confirmar que `trackingStart` en `PlayerMoment` corresponde a segundos desde inicio del partido
   - Confirmar que `matchStart` representa el offset correcto
   - Log valores para debugging:
     ```typescript
     console.log({
       videoTime: currentVideoTime.value,
       matchStart: matchStartSeconds,
       calculatedFrame: currentFrame,
       frameExists: frameData ? 'YES' : 'NO'
     })
     ```

### IMPORTANTE 🟡 - Mejoras de UX

5. **[ ] Remover rectángulo rojo de debug**
   - Líneas 724-728 en `drawTracking()`
   - Está ahí solo para verificar que el canvas funciona

6. **[ ] Detectar equipo automáticamente**
   - Línea 781: `const isHome = playerName.includes('Arsenal')`
   - ⚠️ Hardcodeado para un equipo específico
   - Necesita detectar dinámicamente basado en datos del partido

7. **[ ] Mejorar matching de jugador seleccionado**
   - Función `isPlayerSelectedByName()` puede fallar con nombres complejos
   - Considerar usar ID único si está disponible en los datos

8. **[ ] Agregar feedback visual cuando no hay datos**
   - Mostrar mensaje si tracking no está disponible para el frame actual
   - Indicar rango de frames disponibles

### OPCIONAL 🟢 - Mejoras visuales

9. **[ ] Trails de movimiento**
   - Dibujar las últimas N posiciones del jugador
   - Efecto de "estela" para visualizar trayectoria

10. **[ ] Heatmap**
    - Acumular posiciones durante el partido
    - Visualizar zonas más frecuentadas

11. **[ ] Team colors personalizados**
    - Cargar colores reales de los equipos desde Firestore
    - Aplicar en lugar de rojo/azul genéricos

12. **[ ] Nombres de jugadores en hover**
    - Detectar hover sobre círculos (requiere pointer-events)
    - Mostrar tooltip con info del jugador

13. **[ ] Mini-mapa de campo**
    - Dibujar líneas del campo de fútbol en el canvas
    - Ayuda a orientación espacial

14. **[ ] Performance optimization**
    - Considerar renderizar solo jugadores visibles en pantalla
    - Throttle de `drawTracking()` si hay lag

---

## 📝 Notas Técnicas

### Estructura de Datos Esperada

**Firestore - Match Metadata:**
```
tournaments/{tournamentId}/matches/{matchId}/metadata
{
  VIDEO_ID: "DtD7GNuF3xQ",
  MATCH_START: "08:25", // MM:SS - Cuando empieza el partido en el video
  VAR_TIME: 0 // Segundos a ajustar
}
```

**Firestore - Player Moments:**
```
tournaments/{tournamentId}/matches/{matchId}/playerMoments/{side}_{namePlayer}
{
  side: "home" | "away",
  team: "Arsenal FC",
  namePlayer: "Portero",
  momentsCount: 5,
  moments: [
    {
      startTime: "00:54", // MM:SS desde inicio del partido
      duration: "14s",
      trackingStart: 54, // Frame (segundo) inicial
      trackingEnd: 68 // Frame (segundo) final
    }
  ]
}
```

**Storage - Player Tracking JSON:**
```
raw/{tournamentId}/{matchId}/player-tracking.json
{
  "0": { // Frame number (segundo del partido)
    "player_id_1": [playerName, jersey, x, y, ?],
    "player_id_2": [playerName, jersey, x, y, ?],
    ...
  },
  "1": { ... },
  ...
}
```

### Conversión de Coordenadas

**Fórmula actual (líneas 755-773):**
```typescript
const FIELD_WIDTH = 105  // metros
const FIELD_HEIGHT = 68  // metros

// Asume centro del campo en (0,0)
const xNormalized = (xMeters + FIELD_WIDTH / 2) / FIELD_WIDTH  // 0 a 1
const yNormalized = (yMeters + FIELD_HEIGHT / 2) / FIELD_HEIGHT  // 0 a 1

const x = xNormalized * canvas.width
const y = yNormalized * canvas.height
```

**⚠️ IMPORTANTE:** Esta fórmula asume:
- Coordenadas en metros
- Origen en centro del campo
- Rango X: [-52.5, 52.5]
- Rango Y: [-34, 34]

**Si esto no es correcto, la fórmula debe ajustarse.**

### Sincronización Video-Tracking

**Flujo de tiempo:**
```
1. Usuario hace clic en momento → startTime: "00:54" (MM:SS)
2. Se convierte a segundos → 54s (desde inicio del partido)
3. Se suma MATCH_START → videoTime = 54s + matchStartSeconds
4. YouTube Player salta a → videoTime
5. Canvas calcula frame → currentFrame = videoTime - matchStartSeconds
6. Se busca tracking data → trackingData[currentFrame]
```

---

## 🧪 Plan de Testing

### Test 1: Verificar estructura de datos
```typescript
// En loadTrackingData(), después de descargar
const firstFrame = Object.keys(data)[0]
const firstPlayer = Object.keys(data[firstFrame])[0]
console.log('First frame:', firstFrame)
console.log('First player data:', data[firstFrame][firstPlayer])
console.log('Data structure:', {
  type: typeof data[firstFrame][firstPlayer],
  isArray: Array.isArray(data[firstFrame][firstPlayer]),
  length: data[firstFrame][firstPlayer]?.length,
  values: data[firstFrame][firstPlayer]
})
```

### Test 2: Verificar rango de coordenadas
```typescript
// En loadTrackingData()
const allCoords = []
Object.values(data).forEach(frame => {
  Object.values(frame).forEach(player => {
    if (Array.isArray(player) && player.length >= 4) {
      allCoords.push({ x: player[2], y: player[3] })
    }
  })
})

const xValues = allCoords.map(c => c.x)
const yValues = allCoords.map(c => c.y)

console.log('Coordinate ranges:', {
  x: { min: Math.min(...xValues), max: Math.max(...xValues) },
  y: { min: Math.min(...yValues), max: Math.max(...yValues) }
})
```

### Test 3: Verificar sincronización
```typescript
// En drawTracking(), agregar después de línea 734
console.log('Sync check:', {
  videoTime: currentVideoTime.value.toFixed(1),
  matchStart: matchStartSeconds,
  calculatedFrame: currentFrame,
  frameExists: !!frameData,
  playersInFrame: frameData ? Object.keys(frameData).length : 0
})
```

---

## 📂 Archivos del Feature

```
Gol-360-App/
├── functions/src/
│   ├── tracking/
│   │   └── index.ts                    ✅ Cloud Function proxy
│   └── index.ts                        ✅ Registro de rutas
│
├── src/
│   ├── services/
│   │   └── playerTrackingService.ts    ✅ Service layer
│   │
│   ├── components/tournaments/panels/
│   │   └── DestacadosPanel.vue         ✅ UI Component
│   │
│   └── pages/tournaments/
│       └── TournamentStats.vue         ✅ Page integration
│
└── docs/
    └── PLAYER_TRACKING_STATUS.md       📄 Este documento
```

---

## 🚀 Siguiente Sesión - Plan de Acción

**Objetivo:** Corregir posicionamiento de jugadores en el canvas

**Pasos:**

1. **Inspeccionar archivo de tracking real**
   - Descargar manualmente desde Storage Console
   - O agregar logging completo en `loadTrackingData()`
   - Documentar estructura exacta

2. **Ajustar parsing de datos**
   - Modificar `drawTracking()` según estructura real
   - Probar con diferentes formatos

3. **Calibrar coordenadas**
   - Agregar tests de rango (ver sección Testing)
   - Ajustar constantes `FIELD_WIDTH` y `FIELD_HEIGHT`
   - Ajustar fórmula de conversión si es necesario

4. **Verificar sincronización**
   - Agregar logging detallado
   - Confirmar que frames corresponden a segundos correctos

5. **Testing visual**
   - Cargar tracking data
   - Comparar posiciones en video vs canvas
   - Iterar ajustes hasta que coincidan

---

## 📞 Preguntas para el Cliente/Equipo

1. ¿Cuál es la estructura exacta del JSON de tracking?
2. ¿En qué unidades están las coordenadas (metros, píxeles, normalizadas)?
3. ¿Cuál es el sistema de coordenadas (origen, ejes, rangos)?
4. ¿Los frames del tracking están sincronizados con el inicio del partido o del video?
5. ¿Hay alguna documentación de Veo.co sobre su formato de tracking data?

---

**Última actualización:** 2025-10-24
**Autor:** Claude Code AI Assistant
**Status general:** 🟡 Funcional pero requiere calibración de coordenadas
