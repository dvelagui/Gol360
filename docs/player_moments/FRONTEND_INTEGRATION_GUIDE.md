# 🎯 Guía de Integración del Frontend - GOL360

## 📋 Resumen

Esta guía explica cómo consumir los datos del match desde Firestore y renderizar el player tracking sobre el video en tu aplicación Quasar.

---

## 🗂️ Estructura de Datos en Firestore

```
tournaments/
  └─ {TOURNAMENT_ID}/        (ej: "T97S5C")
      └─ matches/
          └─ {MATCH_ID}/     (ej: "HY98HDY-T97S5C")
              │
              ├─ (documento raíz) - Metadata del match
              │   ├─ HOME_TEAM: "Arsenal"
              │   ├─ AWAY_TEAM: "Newcastle-United"
              │   ├─ MATCH_START: "08:25"  ← Minuto cuando empieza el partido
              │   ├─ VAR_TIME: 40
              │   ├─ scrapedDataAvailable: true
              │   └─ lastScraped: Timestamp
              │
              ├─ stats/              (subcolección)
              │   ├─ home            (documento)
              │   │   └─ data: [array de estadísticas]
              │   └─ away            (documento)
              │       └─ data: [array de estadísticas]
              │
              ├─ shotMaps/           (subcolección)
              │   ├─ home
              │   │   └─ data: [
              │   │       {
              │   │         period: "1º tiempo",
              │   │         screenshot: "gs://...", ← URL del PNG
              │   │         goals: "1",
              │   │         shots: "7",
              │   │         conversionRate: "13%"
              │   │       }
              │   │     ]
              │   └─ away
              │
              ├─ heatMaps/           (subcolección)
              │   ├─ home
              │   └─ away
              │
              ├─ locationMaps/       (subcolección)
              │   ├─ home
              │   └─ away
              │
              ├─ passesStrings/      (subcolección)
              │   ├─ home
              │   └─ away
              │
              ├─ playerMoments/      (subcolección) ⭐ IMPORTANTE
              │   ├─ home_Portero
              │   │   ├─ side: "home"
              │   │   ├─ team: "Arsenal"
              │   │   ├─ namePlayer: "Portero"
              │   │   ├─ momentsCount: 44
              │   │   └─ moments: [
              │   │       {
              │   │         startTime: "00:54",     ← Tiempo en el video
              │   │         duration: "14s",
              │   │         trackingStart: 54,      ← Frame inicial
              │   │         trackingEnd: 68         ← Frame final
              │   │       }
              │   │     ]
              │   ├─ home_Camisetan_º1
              │   ├─ home_Camisetan_º3
              │   ├─ ... (19 jugadores HOME)
              │   ├─ away_Portero
              │   └─ ... (19 jugadores AWAY)
              │
              ├─ highlights/         (subcolección)
              │   ├─ home_0
              │   ├─ home_1
              │   └─ ...
              │
              └─ tracking/           (subcolección) ⭐ IMPORTANTE
                  └─ metadata        (documento)
                      ├─ gcsPath: "gs://bucket/path/player-tracking.json"
                      ├─ signedUrl: "https://..."  ← URL firmada válida 7 días
                      ├─ fileSizeMB: 4.99
                      ├─ urlExpiresAt: Timestamp
                      └─ updatedAt: Timestamp
```

---

## 🎬 Flujo de Datos: Video + Tracking

### 1. **Relación entre tiempo del video y frames de tracking**

```
MATCH_START = "08:25" (8 minutos 25 segundos)
  ↓
Video empieza a las 00:00
Partido empieza a las 08:25
  ↓
Frame 0 del tracking = segundo 0 del partido = segundo 505 del video (8*60 + 25)
Frame 100 del tracking = segundo 100 del partido = segundo 605 del video
```

**Fórmula:**
```javascript
const videoSeconds = currentVideoTime; // ej: 600 (10 minutos de video)
const matchStartSeconds = (8 * 60) + 25; // = 505 segundos
const currentFrame = videoSeconds - matchStartSeconds; // = 95
```

### 2. **Estructura del archivo player-tracking.json**

```json
{
  "0": {                          // Frame 0 (segundo 0 del partido)
    "goalie_left": {
      "x": 0.15,                  // Coordenada X normalizada (0-1)
      "y": 0.50,                  // Coordenada Y normalizada (0-1)
      "jersey": "Portero",
      "team": "home"
    },
    "1_left": {
      "x": 0.35,
      "y": 0.40,
      "jersey": "1",
      "team": "home"
    },
    "goalie_right": {
      "x": 0.85,
      "y": 0.50,
      "jersey": "Portero",
      "team": "away"
    }
    // ... todos los jugadores en el frame 0
  },
  "1": {                          // Frame 1 (segundo 1 del partido)
    "goalie_left": {
      "x": 0.16,                  // Las posiciones se actualizan
      "y": 0.51,
      "jersey": "Portero",
      "team": "home"
    }
    // ...
  }
  // ... hasta frame 5378 (último segundo capturado)
}
```

### 3. **Dibujar en Canvas**

```javascript
// Obtener frame actual
const currentFrame = Math.floor(videoTime - matchStartSeconds);

// Obtener posiciones de todos los jugadores en ese frame
const frameData = trackingData[currentFrame];

// Dibujar cada jugador
Object.entries(frameData).forEach(([playerId, position]) => {
  // Convertir coordenadas normalizadas (0-1) a píxeles del canvas
  const x = position.x * canvasWidth;
  const y = position.y * canvasHeight;

  // Dibujar punto en el canvas
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = position.team === 'home' ? '#FF0000' : '#0000FF';
  ctx.fill();
});
```

---

## 🚀 Implementación en el Frontend

### Paso 1: Instalar archivos

Copia estos archivos a tu proyecto Quasar:

```bash
# Servicio de datos
Gol-360-App/src/services/matchDataService.ts

# Componente de video con tracking
Gol-360-App/src/components/VideoPlayerWithTracking.vue

# Página de ejemplo
Gol-360-App/src/pages/MatchDetailPage.vue
```

### Paso 2: Configurar Firebase

Asegúrate de que tu `src/boot/firebase.ts` exporte correctamente:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'gol360-app',
  // ... otras configuraciones
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Paso 3: Usar el servicio

```typescript
import { MatchDataService } from 'src/services/matchDataService';

const matchService = new MatchDataService('T97S5C', 'HY98HDY-T97S5C');

// Cargar metadata
const metadata = await matchService.getMatchMetadata();

// Cargar players con sus momentos
const homePlayers = await matchService.getPlayerMoments('home');

// Cargar tracking (¡SOLO cuando sea necesario! - son 5MB)
const trackingData = await matchService.downloadPlayerTracking();
```

### Paso 4: Renderizar video + tracking

```vue
<template>
  <video-player-with-tracking
    :video-url="videoUrl"
    :tracking-data="trackingData"
    :player-moments="playerMoments"
    :match-start="metadata.MATCH_START"
  />
</template>
```

---

## 📊 Casos de Uso Principales

### 1. **Mostrar timeline de momentos de un jugador**

```typescript
// Obtener momentos del jugador "Camisetan.º11"
const player = await matchService.getPlayerMomentsByName('home', 'Camisetan.º11');

// player.moments = [
//   { startTime: "02:30", duration: "15s", trackingStart: 150, trackingEnd: 165 },
//   { startTime: "05:45", duration: "12s", trackingStart: 345, trackingEnd: 357 },
//   ...
// ]

// En el video player, cuando currentVideoTime = 510 (8:30):
const currentFrame = 510 - matchStartSeconds; // = 5
const activeMoment = player.moments.find(m =>
  currentFrame >= m.trackingStart && currentFrame <= m.trackingEnd
);

if (activeMoment) {
  // El jugador está activo en este momento
  // Resaltar en el canvas, mostrar información, etc.
}
```

### 2. **Destacar jugador en el tracking**

```typescript
// El usuario hace clic en un jugador
const selectedPlayer = 'home_Camisetan_º11';

// En la función de dibujo del canvas:
Object.entries(frameData).forEach(([playerId, position]) => {
  const isSelected = playerId === selectedPlayer;

  // Dibujar más grande si está seleccionado
  const radius = isSelected ? 12 : 6;

  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = isSelected ? '#FFFF00' : defaultColor;
  ctx.fill();

  // Agregar círculo de selección
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
});
```

### 3. **Filtrar tracking por equipo**

```typescript
// Mostrar solo jugadores del equipo HOME
const homePlayersOnly = Object.entries(frameData).filter(
  ([_, position]) => position.team === 'home'
);

homePlayersOnly.forEach(([playerId, position]) => {
  // Dibujar solo jugadores HOME
  const x = position.x * canvasWidth;
  const y = position.y * canvasHeight;
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#FF0000';
  ctx.fill();
});
```

### 4. **Sincronizar video con momentos**

```typescript
// El usuario hace clic en un momento específico
function goToMoment(moment: PlayerMoment) {
  if (!videoElement.value) return;

  // Convertir frame a tiempo del video
  const matchStartSeconds = parseMatchStart(matchMetadata.MATCH_START);
  const videoTime = moment.trackingStart + matchStartSeconds;

  // Saltar el video a ese momento
  videoElement.value.currentTime = videoTime;
  videoElement.value.play();
}
```

---

## ⚡ Optimizaciones Importantes

### 1. **No descargar tracking automáticamente**

```typescript
// ❌ MAL - Descarga 5MB al cargar la página
onMounted(async () => {
  trackingData.value = await matchService.downloadPlayerTracking();
});

// ✅ BIEN - Solo cuando el usuario lo necesite
const loadTracking = async () => {
  if (!trackingData.value) {
    trackingData.value = await matchService.downloadPlayerTracking();
  }
};
```

### 2. **Cachear el tracking en localStorage**

```typescript
async function downloadPlayerTracking() {
  const cacheKey = `tracking_${tournamentId}_${matchId}`;

  // Verificar cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log('✅ Using cached tracking data');
    return JSON.parse(cached);
  }

  // Descargar
  const trackingData = await matchService.downloadPlayerTracking();

  // Guardar en cache
  localStorage.setItem(cacheKey, JSON.stringify(trackingData));

  return trackingData;
}
```

### 3. **Usar requestAnimationFrame para dibujar**

```typescript
let animationFrameId: number;

function onVideoTimeUpdate() {
  // Cancelar frame anterior
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Programar nuevo frame
  animationFrameId = requestAnimationFrame(() => {
    drawTracking();
  });
}

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
```

### 4. **Lazy loading de imágenes (shot maps, heat maps)**

```vue
<template>
  <img
    v-if="shotMap.screenshot"
    :src="shotMap.screenshot"
    loading="lazy"  <!-- Lazy loading nativo -->
    alt="Shot Map"
  />
</template>
```

---

## 🎨 Personalización del Canvas

### Colores por equipo

```typescript
const TEAM_COLORS = {
  home: {
    primary: '#FF0000',
    secondary: '#FF6B6B',
    selected: '#FFFF00'
  },
  away: {
    primary: '#0000FF',
    secondary: '#4D96FF',
    selected: '#00FFFF'
  }
};

// Usar en el dibujo
ctx.fillStyle = position.team === 'home'
  ? TEAM_COLORS.home.primary
  : TEAM_COLORS.away.primary;
```

### Mostrar trails (estelas de movimiento)

```typescript
// Guardar últimas N posiciones
const playerTrails = new Map<string, Array<{x: number, y: number}>>();

function drawTracking() {
  // ... código existente ...

  // Agregar posición actual al trail
  Object.entries(frameData).forEach(([playerId, position]) => {
    if (!playerTrails.has(playerId)) {
      playerTrails.set(playerId, []);
    }

    const trail = playerTrails.get(playerId);
    trail.push({ x: position.x, y: position.y });

    // Mantener solo últimos 30 frames (30 segundos)
    if (trail.length > 30) {
      trail.shift();
    }

    // Dibujar trail
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    trail.forEach((point, idx) => {
      const x = point.x * canvasWidth;
      const y = point.y * canvasHeight;

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  });
}
```

---

## 🔧 Troubleshooting

### Problema: Las coordenadas del tracking no coinciden con el video

**Solución:** Asegúrate de que el canvas tenga exactamente el mismo aspect ratio que el video:

```typescript
function onVideoLoaded() {
  const videoRect = videoElement.value.getBoundingClientRect();
  canvasWidth.value = videoRect.width;
  canvasHeight.value = videoRect.height;
}

// Re-ajustar en resize
window.addEventListener('resize', onVideoLoaded);
```

### Problema: El tracking se retrasa o adelanta

**Solución:** Verifica que estés usando correctamente el MATCH_START:

```typescript
// Convertir MATCH_START de "MM:SS" a segundos
function parseMatchStart(matchStart: string): number {
  const [mins, secs] = matchStart.split(':').map(Number);
  return mins * 60 + secs;
}

const currentFrame = Math.floor(currentVideoTime - parseMatchStart(MATCH_START));
```

### Problema: URL firmada expirada

**Solución:** Regenerar la URL firmada cada 7 días o antes de usarla:

```typescript
async function getTrackingUrl() {
  const metadata = await matchService.getTrackingMetadata();

  if (new Date() > metadata.urlExpiresAt) {
    // La URL expiró, necesitas regenerarla
    // Esto requiere actualizar el documento en Firestore con una nueva URL
    console.error('URL expirada, contactar backend para regenerar');
    return null;
  }

  return metadata.signedUrl;
}
```

---

## 📝 Resumen

**Datos principales:**
- ✅ Metadata del match (equipos, MATCH_START, VAR_TIME)
- ✅ Stats de equipos
- ✅ Shot maps con screenshots
- ✅ Heat maps con screenshots
- ✅ Player moments (38 jugadores, cada uno con sus momentos)
- ✅ Player tracking (5MB, ~5378 frames)
- ✅ Highlights

**Flujo de trabajo:**
1. Cargar metadata y datos ligeros (stats, players, etc.)
2. Mostrar información al usuario
3. Cuando el usuario quiera ver tracking, descargar el archivo de 5MB
4. Sincronizar video con tracking usando MATCH_START como offset
5. Dibujar posiciones en canvas usando coordenadas normalizadas

**Archivos creados:**
- `frontend-example-service.ts` - Servicio para Firestore
- `frontend-video-tracking-component.vue` - Componente de video con canvas
- `frontend-match-page-example.vue` - Página completa de ejemplo

¡Todo listo para integrar en tu Quasar App! 🚀⚽
