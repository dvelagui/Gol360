si # Player Tracking - Guía de Implementación para Frontend

## Índice
1. [Visión General](#visión-general)
2. [Estructura de Datos](#estructura-de-datos)
3. [Casos de Uso](#casos-de-uso)
4. [Implementación en Frontend](#implementación-en-frontend)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Optimizaciones y Mejores Prácticas](#optimizaciones-y-mejores-prácticas)

---

## Visión General

### ¿Qué es Player Tracking?

El **Player Tracking** es un sistema de seguimiento de posiciones de jugadores y balón en tiempo real durante un partido de fútbol. Los datos provienen de Veo.co y proporcionan coordenadas espaciales sincronizadas con el video del partido.

### ¿Qué puedes hacer con esta información?

1. **Visualización Táctica en Tiempo Real**
   - Mostrar la posición de todos los jugadores sobre el video
   - Crear un mini-mapa táctico sincronizado con el video
   - Destacar el jugador seleccionado con un marcador visual

2. **Análisis de Movimiento**
   - Trazar la trayectoria de un jugador durante un período de tiempo
   - Visualizar mapas de calor de posiciones
   - Analizar patrones de movimiento y formaciones

3. **Replay Táctico**
   - Crear vistas tácticas 2D sincronizadas con el video
   - Mostrar líneas de pase y movimientos
   - Visualizar presión defensiva y espacios

4. **Estadísticas Espaciales**
   - Calcular distancias recorridas
   - Analizar zonas de influencia
   - Medir velocidad y aceleración

---

## Estructura de Datos

### Formato del Archivo `player-tracking.json`

```json
{
  "573.20": [
    [-1, 6, 0.51, 0.35, -1],
    [33, 2, 0.96, 0.49, 1],
    [41, 1, 0.56, 0.08, 7],
    [102, 3, 0.63, 0.13, 8]
  ],
  "573.60": [...],
  "574.00": [...]
}
```

### Anatomía de los Datos

#### **Keys del Objeto (Timestamps)**
- **Formato**: String con formato `"XXX.XX"` (segundos con dos decimales)
- **Significado**: Momento exacto del video en segundos
- **Frecuencia**: Aproximadamente cada 0.4 segundos (~2.5 FPS o 25 FPS con muestreo)
- **Ejemplo**: `"573.20"` = 9 minutos y 33.20 segundos del video

#### **Array de Posiciones**
Cada elemento del array representa una entidad (jugador o balón) en ese instante:

```javascript
[playerId, teamId, x, y, jerseyNumber]
```

| Índice | Campo | Tipo | Descripción | Valores Posibles |
|--------|-------|------|-------------|------------------|
| 0 | `playerId` | Integer | ID único del jugador | `-1` = balón, `> 0` = jugador |
| 1 | `teamId` | Integer | Identificador del equipo/entidad | `0-6` (ver tabla abajo) |
| 2 | `x` | Float | Coordenada X normalizada | `0.0` - `1.0` |
| 3 | `y` | Float | Coordenada Y normalizada | `0.0` - `1.0` |
| 4 | `jerseyNumber` | Integer | Número de camiseta | `-1` = no aplica, `> 0` = número |

#### **Team IDs**

| Team ID | Descripción |
|---------|-------------|
| `0` | Portero Equipo Local |
| `1` | Jugadores Equipo Local |
| `2` | Portero Equipo Visitante |
| `3` | Jugadores Equipo Visitante |
| `4` | Árbitros |
| `6` | Balón |

### Ejemplo Detallado

```javascript
// Frame en el segundo 573.20 del video
"573.20": [
  // Balón
  [-1, 6, 0.51, 0.35, -1],
  // Jugador #33, Portero Visitante, posición (96%, 49%), camiseta #1
  [33, 2, 0.96, 0.49, 1],
  // Jugador #41, Equipo Local, posición (56%, 8%), camiseta #7
  [41, 1, 0.56, 0.08, 7],
  // Jugador #102, Equipo Visitante, posición (63%, 13%), camiseta #8
  [102, 3, 0.63, 0.13, 8]
]
```

### Sistema de Coordenadas

Las coordenadas X e Y están **normalizadas** (0.0 a 1.0):

```
(0.0, 0.0) ────────────────── (1.0, 0.0)
    │                              │
    │         CAMPO DE              │
    │          FÚTBOL               │
    │                              │
(0.0, 1.0) ────────────────── (1.0, 1.0)
```

- **X = 0.0**: Extremo izquierdo del campo
- **X = 1.0**: Extremo derecho del campo
- **Y = 0.0**: Parte superior del campo
- **Y = 1.0**: Parte inferior del campo
- **X = 0.5, Y = 0.5**: Centro del campo

---

## Casos de Uso

### 1. Overlay de Posiciones en Video

**Descripción**: Mostrar puntos sobre el video indicando dónde está cada jugador y el balón.

**Implementación**:
```vue
<template>
  <div class="video-container">
    <video ref="videoPlayer" @timeupdate="onVideoTimeUpdate" />
    <svg class="player-overlay">
      <circle
        v-for="player in currentPositions"
        :key="player.id"
        :cx="player.x * videoWidth"
        :cy="player.y * videoHeight"
        :r="player.isBall ? 8 : 12"
        :fill="getPlayerColor(player.team)"
      />
    </svg>
  </div>
</template>
```

**Resultado**: Círculos de colores sobre cada jugador que se mueven en sincronía con el video.

---

### 2. Mini-Mapa Táctico

**Descripción**: Un campo de fútbol 2D que muestra posiciones en tiempo real.

**Ventajas**:
- Vista aérea completa del partido
- Fácil de analizar formaciones
- Sincronizado con el video principal

**Implementación**:
```vue
<template>
  <div class="tactical-view">
    <div class="field-container">
      <!-- Campo de fútbol SVG -->
      <svg viewBox="0 0 1000 600" class="field">
        <!-- Líneas del campo -->
        <rect class="field-bg" width="1000" height="600" />
        <line class="field-line" x1="500" y1="0" x2="500" y2="600" />
        <circle class="center-circle" cx="500" cy="300" r="80" />

        <!-- Jugadores -->
        <g v-for="player in currentPositions" :key="player.id">
          <circle
            :cx="player.x * 1000"
            :cy="player.y * 600"
            :r="player.isSelected ? 20 : 15"
            :class="getPlayerClass(player)"
          />
          <text
            :x="player.x * 1000"
            :y="player.y * 600"
            class="jersey-number"
          >
            {{ player.jerseyNumber }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
```

**Resultado**: Campo de fútbol con puntos representando jugadores, actualizado frame a frame.

---

### 3. Heat Map (Mapa de Calor)

**Descripción**: Visualizar las zonas donde un jugador pasa más tiempo.

**Casos de uso**:
- Análisis de posicionamiento defensivo
- Zonas de influencia de un jugador
- Comparación entre diferentes partidos

**Implementación**:
```javascript
function generateHeatMap(playerId, startTime, endTime) {
  const heatData = [];

  // Recorrer todos los frames en el rango de tiempo
  for (let time = startTime; time <= endTime; time += 0.4) {
    const frameKey = time.toFixed(2);
    const frame = trackingData[frameKey];

    if (frame) {
      const player = frame.find(p => p[0] === playerId);
      if (player) {
        heatData.push({
          x: player[2],
          y: player[3]
        });
      }
    }
  }

  // Convertir a grid de densidad (10x10)
  const grid = Array(10).fill(0).map(() => Array(10).fill(0));

  heatData.forEach(pos => {
    const gridX = Math.floor(pos.x * 10);
    const gridY = Math.floor(pos.y * 10);
    grid[gridY][gridX]++;
  });

  return grid;
}
```

**Visualización**:
```vue
<template>
  <svg viewBox="0 0 1000 600" class="heatmap">
    <rect
      v-for="(row, y) in heatGrid"
      v-for="(value, x) in row"
      :key="`${x}-${y}`"
      :x="x * 100"
      :y="y * 60"
      width="100"
      height="60"
      :fill="`rgba(255, 0, 0, ${value / maxValue})`"
    />
  </svg>
</template>
```

---

### 4. Trayectorias de Movimiento

**Descripción**: Mostrar el camino recorrido por un jugador durante un período.

**Implementación**:
```javascript
function getPlayerTrajectory(playerId, startTime, duration) {
  const trajectory = [];
  const endTime = startTime + duration;

  for (let time = startTime; time <= endTime; time += 0.4) {
    const frameKey = time.toFixed(2);
    const frame = trackingData[frameKey];

    if (frame) {
      const player = frame.find(p => p[0] === playerId);
      if (player) {
        trajectory.push({
          time: time,
          x: player[2],
          y: player[3]
        });
      }
    }
  }

  return trajectory;
}
```

**Visualización con línea SVG**:
```vue
<template>
  <svg class="trajectory-view">
    <path
      :d="trajectoryPath"
      stroke="blue"
      stroke-width="3"
      fill="none"
    />
    <circle
      v-for="(point, i) in trajectory"
      :key="i"
      :cx="point.x * 1000"
      :cy="point.y * 600"
      r="5"
      :opacity="i / trajectory.length"
    />
  </svg>
</template>

<script>
computed: {
  trajectoryPath() {
    if (!this.trajectory.length) return '';

    return this.trajectory.reduce((path, point, i) => {
      const x = point.x * 1000;
      const y = point.y * 600;
      return path + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  }
}
</script>
```

---

### 5. Distancia Recorrida

**Descripción**: Calcular cuántos metros recorrió un jugador.

**Implementación**:
```javascript
// Dimensiones estándar de un campo de fútbol
const FIELD_LENGTH = 105; // metros
const FIELD_WIDTH = 68;   // metros

function calculateDistance(playerId, startTime, endTime) {
  const trajectory = getPlayerTrajectory(playerId, startTime, endTime);
  let totalDistance = 0;

  for (let i = 1; i < trajectory.length; i++) {
    const prev = trajectory[i - 1];
    const curr = trajectory[i];

    // Calcular distancia euclidiana en coordenadas normalizadas
    const dx = (curr.x - prev.x) * FIELD_LENGTH;
    const dy = (curr.y - prev.y) * FIELD_WIDTH;

    const distance = Math.sqrt(dx * dx + dy * dy);
    totalDistance += distance;
  }

  return totalDistance.toFixed(2); // metros
}
```

**Visualización**:
```vue
<template>
  <div class="player-stats">
    <h3>{{ playerName }} - Estadísticas</h3>
    <div class="stat-item">
      <span class="stat-label">Distancia Recorrida:</span>
      <span class="stat-value">{{ distanceKm }} km</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Velocidad Promedio:</span>
      <span class="stat-value">{{ avgSpeed }} km/h</span>
    </div>
  </div>
</template>
```

---

### 6. Detección de Eventos Tácticos

**Descripción**: Identificar momentos clave basándose en posiciones.

**Ejemplos**:

#### a) Fuera de Juego
```javascript
function detectOffside(frameData, ballPosition) {
  const defendingTeam = 3; // Equipo Visitante
  const attackingTeam = 1; // Equipo Local

  // Encontrar defensor más adelantado (excluyendo portero)
  const defenders = frameData.filter(p => p[1] === defendingTeam);
  const lastDefender = defenders.reduce((last, curr) => {
    return curr[2] > last[2] ? curr : last;
  });

  // Verificar atacantes más adelantados que el último defensor
  const offsidePlayers = frameData.filter(p => {
    return p[1] === attackingTeam && p[2] > lastDefender[2];
  });

  return offsidePlayers.length > 0 ? offsidePlayers : null;
}
```

#### b) Presión Defensiva
```javascript
function calculatePressure(ballCarrier, allPlayers) {
  const PRESSURE_RADIUS = 0.05; // 5% del campo (≈5 metros)

  const nearbyOpponents = allPlayers.filter(player => {
    if (player[1] === ballCarrier[1]) return false; // Mismo equipo

    const dx = player[2] - ballCarrier[2];
    const dy = player[3] - ballCarrier[3];
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < PRESSURE_RADIUS;
  });

  return {
    pressureLevel: nearbyOpponents.length,
    pressurePlayers: nearbyOpponents
  };
}
```

---

## Implementación en Frontend

### Arquitectura Recomendada

```
frontend/
├── src/
│   ├── components/
│   │   ├── PlayerTracking/
│   │   │   ├── VideoOverlay.vue       # Overlay sobre video
│   │   │   ├── TacticalView.vue       # Vista táctica 2D
│   │   │   ├── HeatMap.vue            # Mapa de calor
│   │   │   ├── TrajectoryView.vue     # Trayectorias
│   │   │   └── PlayerStats.vue        # Estadísticas
│   │   └── ...
│   ├── composables/
│   │   └── usePlayerTracking.js       # Lógica reutilizable
│   ├── stores/
│   │   └── trackingStore.js           # Estado global
│   └── utils/
│       └── trackingCalculations.js    # Funciones de cálculo
```

---

### Composable Principal: `usePlayerTracking.js`

```javascript
import { ref, computed, watch } from 'vue';

export function usePlayerTracking(trackingData) {
  const currentTime = ref(0);
  const selectedPlayerId = ref(null);

  // Obtener frame más cercano al tiempo actual
  const currentFrame = computed(() => {
    if (!trackingData) return [];

    const timeKey = currentTime.value.toFixed(1);
    const keys = Object.keys(trackingData);

    // Buscar el key más cercano
    const closestKey = keys.reduce((closest, key) => {
      const diff = Math.abs(parseFloat(key) - currentTime.value);
      const closestDiff = Math.abs(parseFloat(closest) - currentTime.value);
      return diff < closestDiff ? key : closest;
    });

    return trackingData[closestKey] || [];
  });

  // Parsear frame a objetos más legibles
  const currentPositions = computed(() => {
    return currentFrame.value.map(player => ({
      id: player[0],
      team: player[1],
      x: player[2],
      y: player[3],
      jerseyNumber: player[4],
      isBall: player[0] === -1,
      isSelected: player[0] === selectedPlayerId.value
    }));
  });

  // Filtrar por equipo
  const getTeamPlayers = (teamId) => {
    return currentPositions.value.filter(p => p.team === teamId);
  };

  // Obtener balón
  const ballPosition = computed(() => {
    return currentPositions.value.find(p => p.isBall);
  });

  // Obtener jugador específico
  const getPlayer = (playerId) => {
    return currentPositions.value.find(p => p.id === playerId);
  };

  return {
    currentTime,
    selectedPlayerId,
    currentFrame,
    currentPositions,
    ballPosition,
    getTeamPlayers,
    getPlayer
  };
}
```

---

### Store de Pinia: `trackingStore.js`

```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useTrackingStore = defineStore('tracking', () => {
  // Estado
  const trackingData = ref(null);
  const isLoaded = ref(false);
  const error = ref(null);

  // Cargar datos desde la API
  async function loadTrackingData(matchId) {
    try {
      const response = await fetch(`/api/matches/${matchId}/tracking`);
      trackingData.value = await response.json();
      isLoaded.value = true;
    } catch (err) {
      error.value = err.message;
      console.error('Error loading tracking data:', err);
    }
  }

  // Limpiar datos
  function clearData() {
    trackingData.value = null;
    isLoaded.value = false;
    error.value = null;
  }

  // Obtener frame específico
  function getFrame(timestamp) {
    if (!trackingData.value) return [];
    const key = timestamp.toFixed(1);
    return trackingData.value[key] || [];
  }

  // Obtener rango de timestamps
  const timeRange = computed(() => {
    if (!trackingData.value) return { min: 0, max: 0 };
    const keys = Object.keys(trackingData.value).map(parseFloat);
    return {
      min: Math.min(...keys),
      max: Math.max(...keys)
    };
  });

  return {
    trackingData,
    isLoaded,
    error,
    timeRange,
    loadTrackingData,
    clearData,
    getFrame
  };
});
```

---

### Componente Completo: `VideoOverlay.vue`

```vue
<template>
  <div class="video-tracking-container">
    <!-- Video principal -->
    <div class="video-wrapper" ref="videoWrapper">
      <video
        ref="videoPlayer"
        :src="videoSrc"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleVideoLoaded"
        controls
      />

      <!-- Overlay SVG con posiciones -->
      <svg
        v-if="showOverlay"
        class="tracking-overlay"
        :viewBox="`0 0 ${videoWidth} ${videoHeight}`"
      >
        <!-- Balón -->
        <circle
          v-if="ballPosition"
          :cx="ballPosition.x * videoWidth"
          :cy="ballPosition.y * videoHeight"
          r="10"
          class="ball"
        />

        <!-- Jugadores -->
        <g
          v-for="player in players"
          :key="player.id"
          @click="selectPlayer(player.id)"
          class="player-marker"
          :class="{ selected: player.isSelected }"
        >
          <!-- Círculo del jugador -->
          <circle
            :cx="player.x * videoWidth"
            :cy="player.y * videoHeight"
            :r="player.isSelected ? 18 : 12"
            :fill="getTeamColor(player.team)"
            :stroke="player.isSelected ? '#00ff00' : 'white'"
            :stroke-width="player.isSelected ? 3 : 1"
          />

          <!-- Número de camiseta -->
          <text
            :x="player.x * videoWidth"
            :y="player.y * videoHeight"
            class="jersey-number"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ player.jerseyNumber > 0 ? player.jerseyNumber : '' }}
          </text>
        </g>

        <!-- Trayectoria del jugador seleccionado -->
        <path
          v-if="selectedTrajectory.length > 0"
          :d="trajectoryPath"
          class="trajectory"
        />
      </svg>
    </div>

    <!-- Controles -->
    <div class="controls">
      <button @click="showOverlay = !showOverlay">
        {{ showOverlay ? 'Ocultar' : 'Mostrar' }} Tracking
      </button>
      <button @click="clearSelection">
        Limpiar Selección
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { usePlayerTracking } from '@/composables/usePlayerTracking';
import { useTrackingStore } from '@/stores/trackingStore';

const props = defineProps({
  videoSrc: String,
  matchId: String
});

// Referencias
const videoPlayer = ref(null);
const videoWrapper = ref(null);
const videoWidth = ref(0);
const videoHeight = ref(0);
const showOverlay = ref(true);

// Store
const trackingStore = useTrackingStore();

// Composable
const {
  currentTime,
  selectedPlayerId,
  currentPositions,
  ballPosition
} = usePlayerTracking(trackingStore.trackingData);

// Computadas
const players = computed(() => {
  return currentPositions.value.filter(p => !p.isBall);
});

const selectedTrajectory = ref([]);

const trajectoryPath = computed(() => {
  if (selectedTrajectory.value.length === 0) return '';

  return selectedTrajectory.value.reduce((path, point, i) => {
    const x = point.x * videoWidth.value;
    const y = point.y * videoHeight.value;
    return path + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }, '');
});

// Métodos
function handleVideoLoaded() {
  videoWidth.value = videoPlayer.value.videoWidth;
  videoHeight.value = videoPlayer.value.videoHeight;
}

function handleTimeUpdate() {
  currentTime.value = videoPlayer.value.currentTime;
}

function selectPlayer(playerId) {
  selectedPlayerId.value = playerId;
  loadPlayerTrajectory(playerId);
}

function clearSelection() {
  selectedPlayerId.value = null;
  selectedTrajectory.value = [];
}

function loadPlayerTrajectory(playerId) {
  const trajectory = [];
  const startTime = currentTime.value - 10; // Últimos 10 segundos
  const endTime = currentTime.value;

  for (let t = startTime; t <= endTime; t += 0.4) {
    const frame = trackingStore.getFrame(t);
    const player = frame.find(p => p[0] === playerId);

    if (player) {
      trajectory.push({
        x: player[2],
        y: player[3],
        time: t
      });
    }
  }

  selectedTrajectory.value = trajectory;
}

function getTeamColor(teamId) {
  const colors = {
    0: '#FFD700', // Portero Local (dorado)
    1: '#0066CC', // Jugadores Local (azul)
    2: '#FFD700', // Portero Visitante (dorado)
    3: '#CC0000', // Jugadores Visitante (rojo)
    4: '#000000'  // Árbitros (negro)
  };
  return colors[teamId] || '#CCCCCC';
}

// Cargar datos al montar
onMounted(() => {
  trackingStore.loadTrackingData(props.matchId);
});
</script>

<style scoped>
.video-tracking-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.video-wrapper {
  position: relative;
  width: 100%;
  background: #000;
}

video {
  width: 100%;
  height: auto;
  display: block;
}

.tracking-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.player-marker {
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s ease;
}

.player-marker:hover circle {
  stroke-width: 2;
  r: 15;
}

.player-marker.selected circle {
  filter: drop-shadow(0 0 10px #00ff00);
}

.jersey-number {
  fill: white;
  font-size: 10px;
  font-weight: bold;
  pointer-events: none;
}

.ball {
  fill: white;
  stroke: #333;
  stroke-width: 2;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
}

.trajectory {
  fill: none;
  stroke: #00ff00;
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  opacity: 0.7;
}

.controls {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #0066CC;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #0052A3;
}
</style>
```

---

## Optimizaciones y Mejores Prácticas

### 1. Lazy Loading de Datos

```javascript
// Cargar solo los frames necesarios para un rango de tiempo
async function loadTrackingRange(matchId, startTime, endTime) {
  const response = await fetch(
    `/api/matches/${matchId}/tracking?start=${startTime}&end=${endTime}`
  );
  return await response.json();
}
```

### 2. Interpolación de Frames

```javascript
// Suavizar movimiento entre frames
function interpolatePosition(player1, player2, ratio) {
  return {
    x: player1.x + (player2.x - player1.x) * ratio,
    y: player1.y + (player2.y - player1.y) * ratio
  };
}

function getSmoothPosition(playerId, exactTime) {
  const prevKey = Math.floor(exactTime / 0.4) * 0.4;
  const nextKey = prevKey + 0.4;

  const prevFrame = trackingData[prevKey.toFixed(1)];
  const nextFrame = trackingData[nextKey.toFixed(1)];

  if (!prevFrame || !nextFrame) return null;

  const prevPlayer = prevFrame.find(p => p[0] === playerId);
  const nextPlayer = nextFrame.find(p => p[0] === playerId);

  if (!prevPlayer || !nextPlayer) return null;

  const ratio = (exactTime - prevKey) / 0.4;
  return interpolatePosition(
    { x: prevPlayer[2], y: prevPlayer[3] },
    { x: nextPlayer[2], y: nextPlayer[3] },
    ratio
  );
}
```

### 3. Web Workers para Cálculos Pesados

```javascript
// workers/trackingWorker.js
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'calculateHeatMap':
      const heatMap = generateHeatMap(data.playerId, data.trackingData);
      self.postMessage({ type: 'heatMapReady', data: heatMap });
      break;

    case 'calculateDistance':
      const distance = calculateDistance(data.trajectory);
      self.postMessage({ type: 'distanceReady', data: distance });
      break;
  }
};
```

### 4. Caché Inteligente

```javascript
// Cache con IndexedDB para datos grandes
import { openDB } from 'idb';

const dbPromise = openDB('tracking-cache', 1, {
  upgrade(db) {
    db.createObjectStore('matches');
  }
});

async function getCachedTracking(matchId) {
  const db = await dbPromise;
  return await db.get('matches', matchId);
}

async function cacheTracking(matchId, data) {
  const db = await dbPromise;
  await db.put('matches', data, matchId);
}
```

### 5. Performance con Canvas en lugar de SVG

```javascript
// Para muchos jugadores, Canvas es más eficiente que SVG
function drawTrackingCanvas(ctx, positions, width, height) {
  ctx.clearRect(0, 0, width, height);

  positions.forEach(player => {
    const x = player.x * width;
    const y = player.y * height;

    // Dibujar jugador
    ctx.beginPath();
    ctx.arc(x, y, player.isSelected ? 18 : 12, 0, Math.PI * 2);
    ctx.fillStyle = getTeamColor(player.team);
    ctx.fill();
    ctx.strokeStyle = player.isSelected ? '#00ff00' : 'white';
    ctx.lineWidth = player.isSelected ? 3 : 1;
    ctx.stroke();

    // Dibujar número
    if (player.jerseyNumber > 0) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.jerseyNumber, x, y);
    }
  });
}
```

### 6. Actualización Eficiente con requestAnimationFrame

```javascript
let animationFrameId = null;

function startTracking() {
  function update() {
    const currentTime = videoPlayer.value.currentTime;
    updatePositions(currentTime);
    animationFrameId = requestAnimationFrame(update);
  }

  animationFrameId = requestAnimationFrame(update);
}

function stopTracking() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}
```

---

## Resumen de Capacidades

| Funcionalidad | Complejidad | Impacto Visual | Valor Analítico |
|---------------|-------------|----------------|-----------------|
| Video Overlay | Baja | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Mini-Mapa Táctico | Media | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Heat Map | Media | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Trayectorias | Media | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Distancia Recorrida | Baja | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Detección Eventos | Alta | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Próximos Pasos

1. **Backend**: Implementar endpoint de scraping para extraer `player-tracking.json`
2. **Almacenamiento**: Guardar archivo junto con datos del partido
3. **API**: Crear endpoint para servir datos de tracking
4. **Frontend**: Implementar componentes básicos de visualización
5. **Optimización**: Agregar caché y lazy loading
6. **Features Avanzadas**: Heat maps, trayectorias, análisis táctico

---

**Autor**: Claude Code
**Fecha**: 2025-10-22
**Versión**: 1.0
