<!--
  Componente de ejemplo para renderizar player tracking sobre el video
  Path: Gol-360-App/src/components/VideoPlayerWithTracking.vue
-->

<template>
  <div class="video-tracking-container">
    <!-- Video player -->
    <div class="video-wrapper" ref="videoWrapper">
      <video
        ref="videoElement"
        :src="videoUrl"
        @timeupdate="onVideoTimeUpdate"
        @loadedmetadata="onVideoLoaded"
        controls
        class="main-video"
      />

      <!-- Canvas overlay para dibujar el tracking -->
      <canvas
        ref="trackingCanvas"
        class="tracking-overlay"
        :width="canvasWidth"
        :height="canvasHeight"
      />
    </div>

    <!-- Controles adicionales -->
    <div class="tracking-controls">
      <q-toggle
        v-model="showTracking"
        label="Mostrar tracking"
        color="primary"
      />

      <q-select
        v-model="selectedPlayer"
        :options="playerOptions"
        label="Seguir jugador"
        emit-value
        map-options
        clearable
        dense
        class="q-ml-md"
        style="min-width: 200px"
      />

      <div class="q-ml-md">
        Frame actual: {{ currentFrame }} / {{ totalFrames }}
      </div>

      <div class="q-ml-md">
        Tiempo video: {{ formatTime(currentVideoTime) }}
      </div>
    </div>

    <!-- Panel de información del jugador seleccionado -->
    <div v-if="selectedPlayerInfo" class="player-info-panel">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ selectedPlayerInfo.namePlayer }}</div>
          <div class="text-subtitle2">{{ selectedPlayerInfo.team }} ({{ selectedPlayerInfo.side }})</div>
          <div class="q-mt-sm">
            Momentos activos: {{ selectedPlayerInfo.momentsCount }}
          </div>
          <div v-if="currentPlayerMoment" class="q-mt-sm text-positive">
            🎯 Momento activo: {{ currentPlayerMoment.startTime }} ({{ currentPlayerMoment.duration }})
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface PlayerMoment {
  startTime: string;
  duration: string;
  trackingStart: number;
  trackingEnd: number;
}

interface PlayerMomentsData {
  side: 'home' | 'away';
  team: string;
  namePlayer: string;
  moments: PlayerMoment[];
  momentsCount: number;
}

interface TrackingFrame {
  [playerId: string]: {
    x: number; // Coordenada X normalizada (0-1)
    y: number; // Coordenada Y normalizada (0-1)
    jersey?: string;
    team?: string;
  };
}

interface PlayerTrackingData {
  [timestamp: number]: TrackingFrame;
}

// Props
const props = defineProps<{
  videoUrl: string;
  trackingData: PlayerTrackingData | null;
  playerMoments: PlayerMomentsData[];
  matchStart?: string; // Formato "MM:SS" - minuto cuando empieza el partido
}>();

// Refs
const videoElement = ref<HTMLVideoElement | null>(null);
const trackingCanvas = ref<HTMLCanvasElement | null>(null);
const videoWrapper = ref<HTMLDivElement | null>(null);

const canvasWidth = ref(1280);
const canvasHeight = ref(720);
const currentVideoTime = ref(0);
const showTracking = ref(true);
const selectedPlayer = ref<string | null>(null);

// Computed
const totalFrames = computed(() => {
  if (!props.trackingData) return 0;
  return Object.keys(props.trackingData).length;
});

const playerOptions = computed(() => {
  return props.playerMoments.map(player => ({
    label: `${player.namePlayer} (${player.team})`,
    value: `${player.side}_${player.namePlayer}`.replace(/[^\w-]/g, '_')
  }));
});

const selectedPlayerInfo = computed(() => {
  if (!selectedPlayer.value) return null;
  return props.playerMoments.find(
    p => `${p.side}_${p.namePlayer}`.replace(/[^\w-]/g, '_') === selectedPlayer.value
  );
});

// Calcular el frame actual basado en el tiempo del video
const currentFrame = computed(() => {
  if (!props.trackingData) return 0;

  // Convertir tiempo del video a segundos desde el inicio del partido
  const videoSeconds = Math.floor(currentVideoTime.value);

  // Si hay MATCH_START (ej: "08:25"), ajustar el offset
  let matchStartSeconds = 0;
  if (props.matchStart) {
    const [mins, secs] = props.matchStart.split(':').map(Number);
    matchStartSeconds = mins * 60 + secs;
  }

  // Frame actual = segundos del video - offset de match start
  const frameTimestamp = videoSeconds - matchStartSeconds;

  return frameTimestamp;
});

// Momento activo del jugador seleccionado
const currentPlayerMoment = computed(() => {
  if (!selectedPlayerInfo.value) return null;

  const frame = currentFrame.value;

  return selectedPlayerInfo.value.moments.find(
    moment => frame >= moment.trackingStart && frame <= moment.trackingEnd
  );
});

// Methods
function onVideoLoaded() {
  if (!videoElement.value || !videoWrapper.value) return;

  // Ajustar tamaño del canvas al video
  const videoRect = videoElement.value.getBoundingClientRect();
  canvasWidth.value = videoRect.width;
  canvasHeight.value = videoRect.height;
}

function onVideoTimeUpdate() {
  if (!videoElement.value) return;
  currentVideoTime.value = videoElement.value.currentTime;

  // Redibujar tracking en cada frame
  if (showTracking.value) {
    drawTracking();
  }
}

function drawTracking() {
  if (!trackingCanvas.value || !props.trackingData) return;

  const canvas = trackingCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const frame = currentFrame.value;

  // Obtener datos del frame actual
  const frameData = props.trackingData[frame];

  if (!frameData) return;

  // Dibujar cada jugador en el campo
  Object.entries(frameData).forEach(([playerId, position]) => {
    // Convertir coordenadas normalizadas (0-1) a coordenadas del canvas
    const x = position.x * canvas.width;
    const y = position.y * canvas.height;

    // Determinar si este jugador está seleccionado
    const isSelected = selectedPlayer.value === playerId;

    // Dibujar punto del jugador
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 12 : 6, 0, 2 * Math.PI);

    // Color según equipo
    if (position.team === 'home') {
      ctx.fillStyle = isSelected ? '#FF0000' : '#FF6B6B';
    } else {
      ctx.fillStyle = isSelected ? '#0000FF' : '#4D96FF';
    }

    ctx.fill();

    // Borde blanco para mejor visibilidad
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mostrar número de camiseta si existe
    if (position.jersey) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isSelected ? 'bold 14px Arial' : 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(position.jersey, x, y);
    }

    // Si está seleccionado, dibujar un círculo adicional
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Mostrar nombre del jugador
      if (selectedPlayerInfo.value) {
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(selectedPlayerInfo.value.namePlayer, x, y - 30);
      }
    }
  });

  // Dibujar información del momento activo
  if (currentPlayerMoment.value && selectedPlayerInfo.value) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 ${selectedPlayerInfo.value.namePlayer}`, 20, 30);
    ctx.font = '12px Arial';
    ctx.fillText(`Momento: ${currentPlayerMoment.value.startTime}`, 20, 50);
    ctx.fillText(`Duración: ${currentPlayerMoment.value.duration}`, 20, 65);
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Watchers
watch(showTracking, (newVal) => {
  if (newVal) {
    drawTracking();
  } else if (trackingCanvas.value) {
    const ctx = trackingCanvas.value.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, trackingCanvas.value.width, trackingCanvas.value.height);
    }
  }
});

watch(selectedPlayer, () => {
  drawTracking();
});

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', onVideoLoaded);
});

onUnmounted(() => {
  window.removeEventListener('resize', onVideoLoaded);
});
</script>

<style scoped lang="scss">
.video-tracking-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.video-wrapper {
  position: relative;
  width: 100%;
  background: #000;
}

.main-video {
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
  pointer-events: none; /* Permitir clicks en el video */
}

.tracking-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-top: 16px;
}

.player-info-panel {
  margin-top: 16px;
}
</style>
