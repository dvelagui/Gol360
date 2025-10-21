# Arquitectura de Video Analytics - GOL360

## Resumen Ejecutivo

Este documento describe la arquitectura completa del sistema de estadísticas de videos, clips y destacados implementado en **Gol-360-App**. El sistema permite visualizar analytics deportivos, highlights y momentos de jugadores sincronizados con videos de YouTube.

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Estructura de Datos](#estructura-de-datos)
4. [Componentes Vue](#componentes-vue)
5. [Servicios y API](#servicios-y-api)
6. [Gestión de Estado](#gestión-de-estado)
7. [Flujo de Datos](#flujo-de-datos)
8. [Integración con YouTube](#integración-con-youtube)
9. [Conversión de URLs de Storage](#conversión-de-urls-de-storage)
10. [Migración a Astro](#migración-a-astro)

---

## 1. Descripción General

### Características Principales

El sistema implementa tres vistas principales:

1. **Analytics Panel**: Estadísticas del partido (goles, tiros, mapas de calor, secuencias de pases)
2. **Clips Panel**: Highlights del partido con navegación temporal en YouTube
3. **Destacados Panel**: Momentos individuales de jugadores con reproducción automática

### Tecnologías Utilizadas

- **Frontend**: Vue 3 + Quasar Framework + TypeScript
- **API**: REST API que consume datos de scraping de VEO
- **Storage**: Google Cloud Storage (gs://)
- **Video**: YouTube IFrame API
- **Estado**: Pinia stores + Composables

---

## 2. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     TournamentStats.vue                      │
│                    (Página Principal)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │  Tournament │  │    Match    │  │   Tab System     │    │
│  │  Selector   │  │  Selector   │  │ Analytics/Clips/ │    │
│  │             │  │             │  │   Destacados     │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌─────────────┐ ┌───────────────┐
    │ Analytics    │ │   Clips     │ │  Destacados   │
    │   Panel      │ │   Panel     │ │    Panel      │
    └──────────────┘ └─────────────┘ └───────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            ▼
            ┌───────────────────────────────┐
            │     analyticsService.ts       │
            │  (API de Analytics + VEO)     │
            └───────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌─────────────┐ ┌───────────────┐
    │  Firestore   │ │  Cloud      │ │   YouTube     │
    │  (Matches)   │ │  Storage    │ │   IFrame API  │
    └──────────────┘ └─────────────┘ └───────────────┘
```

---

## 3. Estructura de Datos

### 3.1 Tipos de Analytics (`src/types/analytics.ts`)

#### AnalyticsResponse

Respuesta principal de la API:

```typescript
interface AnalyticsResponse {
  tournament_id: string        // ID del torneo (ej: "VeteranosTunja2025")
  match_id: string             // ID del partido (ej: "LibVsColo")
  teams: string[]              // Nombres de equipos ["ColoColo", "IndValle"]
  data: {
    heatMap?: HeatMapEntry[]
    highlights?: HighlightsEntry[]
    passNetwork?: PassNetworkEntry[]
    playerStats?: PlayerStatsEntry[]
    playerMoments?: PlayerMomentsEntry[]
    [key: string]: unknown
  }
}
```

#### HeatMapEntry

Mapas de calor por equipo y período:

```typescript
interface HeatMapEntry {
  tournament_id: string
  match_id: string
  team: string                 // Nombre del equipo
  data_type: 'heatMap'
  data: HeatMapData[]
  source_file: string
  processed_at: string
}

interface HeatMapData {
  team: string
  period: string               // "Full recording" | "1st period" | "2nd period"
  screenshot: string           // URL gs:// a la imagen
}
```

#### HighlightsEntry

Clips destacados con timestamps:

```typescript
interface HighlightsEntry {
  tournament_id: string
  match_id: string
  team: string
  data_type: 'highlights'
  highlights: HighlightVideo[]
  itemCount: number
}

interface HighlightVideo {
  team: string
  index: number                // Índice del clip
  tag: string                  // "Gol" | "Tiro directo a portería" | etc.
  timecode: string             // "04:07" (mm:ss)
  timeInSeconds: number        // 247 (segundos)
  videoUrl: string             // URL de descarga del clip (VEO CDN)
  rawJson: string
}
```

#### PlayerMomentsEntry

Momentos de jugadores individuales:

```typescript
interface PlayerMomentsEntry {
  tournament_id: string
  match_id: string
  team: string
  data_type: 'playerMoments'
  data: PlayerMoment[]
}

interface PlayerMoment {
  team: string
  name: string                 // Nombre del jugador
  moments: MomentTimestamp[]
}

interface MomentTimestamp {
  startTime: string            // "02:28"
  duration: string             // "11s"
  startTimeInSeconds: number   // 148
  durationInSeconds: number    // 11
  endTimeInSeconds: number     // 159
}
```

---

## 4. Componentes Vue

### 4.1 TournamentStats.vue (Página Principal)

**Ubicación**: `src/pages/tournaments/TournamentStats.vue`

**Responsabilidades**:
- Selector de torneo (persistido en localStorage)
- Selector de partido
- Sistema de tabs (Analytics / Clips / Destacados)
- Lazy loading de paneles con `defineAsyncComponent`
- Carga de analytics data desde API

**Estado Principal**:

```typescript
const tournaments = ref<Tournament[]>([])
const selectedMatch = ref<MatchOption | null>(null)
const analyticsData = ref<AnalyticsResponse | null>(null)
const tab = ref<'analytics' | 'clips' | 'destacados'>('analytics')
const showMatchSelector = ref(false)
```

**Flujo de Carga**:

```typescript
onMounted(async () => {
  // 1. Cargar torneos
  await tStore.fetch()
  tournaments.value = tStore.items

  // 2. Cargar partidos del torneo seleccionado
  if (tId.value) {
    await loadMatches()
  }

  // 3. Auto-seleccionar primer partido
  if (matches.value.length > 0) {
    selectedMatch.value = matches.value[0]
    await loadAnalytics()
  }
})
```

**Carga de Analytics**:

```typescript
async function loadAnalytics() {
  if (!selectedMatch.value) return

  isLoadingAnalytics.value = true
  try {
    analyticsData.value = await analyticsService.getMatchAnalytics(
      selectedMatch.value.tournamentId,
      selectedMatch.value.matchId
    )
  } catch (error) {
    Notify.create({
      type: 'warning',
      message: 'No hay datos de analytics disponibles'
    })
  } finally {
    isLoadingAnalytics.value = false
  }
}
```

---

### 4.2 AnalyticsPanel.vue

**Ubicación**: `src/components/tournaments/panels/AnalyticsPanel.vue`

**Props**:

```typescript
interface Props {
  analyticsData?: Record<string, unknown> | null
  loading?: boolean
}
```

**Características**:
- Selector de equipo (toggle entre equipos)
- Estadísticas generales (goles, tiros, conversión)
- Mapa de ubicación (zonas defensiva/media/ofensiva)
- Mapa de tiros (con imagen de screenshot)
- Mapa de calor (con imagen de screenshot)
- Secuencias de pases (gráfico de barras)
- Selectores de período independientes por sección

**Estado**:

```typescript
const selectedTeam = ref<'ColoColo' | 'IndValle'>('ColoColo')
const selectedPeriod = ref<'Full recording' | '1st period' | '2nd period'>('Full recording')
const selectedLocationMapPeriod = ref<Period>('Full recording')
const selectedShotMapPeriod = ref<Period>('Full recording')
const selectedPassesPeriod = ref<Period>('Full recording')
```

**Visualización de Imágenes**:

```vue
<q-img
  :src="currentHeatMap.screenshot"
  :ratio="16/9"
  fit="contain"
  class="rounded-borders"
>
  <template #error>
    <div class="error-state">
      <q-icon name="broken_image" size="64px" />
      <p>Error al cargar la imagen</p>
    </div>
  </template>
  <template #loading>
    <q-spinner color="primary" size="50px" />
  </template>
</q-img>
```

**Gráfico de Barras** (Secuencias de Pases):

```vue
<div class="passes-bars">
  <div
    v-for="(bar, index) in currentPassesStrings.bars"
    :key="index"
    class="passes-bar-wrapper"
  >
    <div
      class="passes-bar"
      :style="{ height: `${(bar / maxBarValue) * 100}%` }"
    >
      <span class="passes-bar-value">{{ bar }}</span>
    </div>
    <div class="passes-bar-label">
      {{ currentPassesStrings.xAxisLabels[index] }}
    </div>
  </div>
</div>
```

---

### 4.3 ClipsPanel.vue

**Ubicación**: `src/components/tournaments/panels/ClipsPanel.vue`

**Props**:

```typescript
interface Props {
  highlightsData?: unknown
  youtubeVideoId: string       // ID del video de YouTube
  loading?: boolean
}
```

**Características**:
- Selector de equipo
- Reproductor de YouTube embebido
- Lista de clips con timestamps
- Navegación temporal en YouTube
- Vista previa de videos (hover para reproducir)
- Descarga de clips individuales

**Integración con YouTube**:

```typescript
const youtubeEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${props.youtubeVideoId}?enablejsapi=1&rel=0&autoplay=0`
})

function goToYouTubeTimestamp(timeInSeconds: number) {
  if (youtubePlayer.value && youtubePlayer.value.contentWindow) {
    // Highlight visual
    isVideoHighlighted.value = true

    // Scroll al video
    scrollToVideo()

    // Saltar al timestamp usando YouTube IFrame API
    setTimeout(() => {
      youtubePlayer.value.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [timeInSeconds, true]
        }),
        '*'
      )

      // Auto-play
      setTimeout(() => {
        youtubePlayer.value.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'playVideo',
            args: []
          }),
          '*'
        )
      }, 100)
    }, 600)
  }
}
```

**Card de Clip**:

```vue
<q-card
  v-for="(clip, index) in currentClips"
  :key="index"
  class="clip-card"
  @click="goToYouTubeTimestamp(clip.timeInSeconds)"
>
  <q-card-section class="clip-header">
    <div class="clip-index">#{{ clip.index }}</div>
    <q-chip
      :color="getTagColor(clip.tag)"
      text-color="white"
    >
      {{ clip.tag }}
    </q-chip>
  </q-card-section>

  <q-card-section class="clip-body">
    <div class="clip-time">
      <q-icon name="schedule" />
      <span class="timecode">{{ clip.timecode }}</span>
    </div>
  </q-card-section>

  <q-card-section class="clip-footer">
    <q-btn
      outline
      color="primary"
      icon="play_arrow"
      label="Ver momento"
      @click.stop="goToYouTubeTimestamp(clip.timeInSeconds)"
    />
  </q-card-section>

  <!-- Vista previa del clip -->
  <q-card-section v-if="clip.videoUrl" class="clip-thumbnail">
    <video
      :src="clip.videoUrl"
      preload="metadata"
      muted
      @mouseenter="(e) => e.target?.play()"
      @mouseleave="(e) => { e.target?.pause(); e.target.currentTime = 0; }"
    />
  </q-card-section>
</q-card>
```

**Descarga de Clips**:

```typescript
function downloadClip(videoUrl: string, tag: string, timecode: string) {
  if (!videoUrl) return
  console.log(`⬇️ Downloading clip: ${tag} at ${timecode}`)
  openURL(videoUrl)  // Abre el CDN de VEO en nueva pestaña
}
```

---

### 4.4 DestacadosPanel.vue

**Ubicación**: `src/components/tournaments/panels/DestacadosPanel.vue`

**Props**:

```typescript
interface Props {
  playerMomentsData?: unknown
  youtubeVideoId: string
  loading?: boolean
}
```

**Características**:
- Selector de jugador (dropdown)
- Reproductor de YouTube
- Lista de momentos con timestamps
- **Reproducción automática** (auto-play entre momentos)
- Contador regresivo (15 segundos)
- Barra de progreso
- Navegación manual entre momentos

**Estado**:

```typescript
const selectedPlayer = ref<string>('')
const isAutoPlaying = ref(false)
const currentMomentIndex = ref(0)
const countdown = ref(15)
const progressPercent = ref(0)

let countdownInterval: number | null = null
```

**Reproducción Automática**:

```typescript
function startAutoPlay() {
  isAutoPlaying.value = true
  goToMoment(currentMomentIndex.value)
  resetCountdown()
}

function resetCountdown() {
  clearIntervals()
  countdown.value = 15
  progressPercent.value = 0

  // Timer que cuenta regresivamente
  countdownInterval = window.setInterval(() => {
    countdown.value--
    progressPercent.value = 1 - (countdown.value / 15)

    if (countdown.value <= 0) {
      goToNextMoment()
    }
  }, 1000)
}

function goToNextMoment() {
  const nextIndex = currentMomentIndex.value + 1

  if (nextIndex < currentMoments.value.length) {
    goToMoment(nextIndex)
  } else {
    // Loop al primer momento
    goToMoment(0)
  }
}
```

**Controles de Auto-Play**:

```vue
<div class="autoplay-controls">
  <q-btn
    v-if="!isAutoPlaying"
    outline
    color="primary"
    icon="play_arrow"
    label="Reproducción automática"
    @click="startAutoPlay"
  />
  <q-btn
    v-else
    outline
    color="negative"
    icon="pause"
    label="Detener automático"
    @click="stopAutoPlay"
  />

  <q-chip
    v-if="isAutoPlaying"
    color="primary"
    text-color="white"
    icon="timer"
  >
    {{ countdown }}s
  </q-chip>
</div>
```

**Card de Momento**:

```vue
<q-card
  v-for="(moment, index) in currentMoments"
  :key="index"
  class="moment-card"
  :class="{ 'moment-active': currentMomentIndex === index }"
  @click="goToMoment(index)"
>
  <q-card-section class="moment-content">
    <div class="moment-index">
      <q-icon
        :name="currentMomentIndex === index ? 'play_circle' : 'radio_button_unchecked'"
        :color="currentMomentIndex === index ? 'primary' : 'grey-6'"
        size="32px"
      />
      <span>#{{ index + 1 }}</span>
    </div>

    <div class="moment-details">
      <div class="moment-time">
        <q-icon name="schedule" />
        <span class="timecode">{{ moment.startTime }}</span>
      </div>
      <div class="moment-duration">
        <q-icon name="timer" />
        <span>{{ moment.duration }}</span>
      </div>
    </div>
  </q-card-section>

  <!-- Barra de progreso durante auto-play -->
  <q-linear-progress
    v-if="currentMomentIndex === index && isAutoPlaying"
    :value="progressPercent"
    color="primary"
  />
</q-card>
```

---

## 5. Servicios y API

### 5.1 analyticsService.ts

**Ubicación**: `src/services/analyticsService.ts`

**Métodos principales**:

```typescript
class AnalyticsService {
  /**
   * Obtiene todos los analytics de un partido
   */
  async getMatchAnalytics(
    tournamentId: string,
    matchId: string
  ): Promise<AnalyticsResponse> {
    const url = `/gol360-api/api/matches/${tournamentId}/${matchId}/analytics`
    const response = await api.get<AnalyticsResponse>(url)
    return response.data
  }

  /**
   * Obtiene solo los highlights
   */
  async getMatchHighlights(tournamentId: string, matchId: string) {
    const data = await this.getMatchAnalytics(tournamentId, matchId)
    return data.data.highlights || []
  }

  /**
   * Obtiene solo los heat maps
   */
  async getMatchHeatMaps(tournamentId: string, matchId: string) {
    const data = await this.getMatchAnalytics(tournamentId, matchId)
    return data.data.heatMap || []
  }
}

export default new AnalyticsService()
```

**Endpoint de API**:

```
GET /gol360-api/api/matches/:tournamentId/:matchId/analytics

Response:
{
  "tournament_id": "VeteranosTunja2025",
  "match_id": "LibVsColo",
  "teams": ["ColoColo", "IndValle"],
  "data": {
    "heatMap": [...],
    "highlights": [...],
    "playerMoments": [...]
  }
}
```

---

### 5.2 storageService.ts

**Ubicación**: `src/services/storageService.ts`

**Propósito**: Convertir URLs de Google Cloud Storage (gs://) a URLs HTTPS públicas.

```typescript
class StorageService {
  /**
   * Convierte gs:// a https://
   * Ejemplo:
   * Input:  gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/heat_map.png
   * Output: https://storage.googleapis.com/gol360-scrape-raw-prod/raw/VeteranosTunja2025/heat_map.png
   */
  convertGsUrlToHttps(gsUrl: string): string {
    if (!gsUrl.startsWith('gs://')) {
      throw new Error('Invalid gs:// URL format')
    }

    return gsUrl.replace('gs://', 'https://storage.googleapis.com/')
  }

  /**
   * Verifica si es URL gs://
   */
  isGsUrl(url: string): boolean {
    return url.startsWith('gs://')
  }

  /**
   * Convierte solo si es necesario
   */
  ensureHttpsUrl(url: string): string {
    if (this.isGsUrl(url)) {
      return this.convertGsUrlToHttps(url)
    }
    return url
  }
}

export default new StorageService()
```

**Uso en Componentes**:

```typescript
// En AnalyticsPanel.vue
import storageService from '@/services/storageService'

const imageUrls = ref<{
  heatMap: { [team: string]: { [period: string]: string | null } }
  shotMap: { [team: string]: { [period: string]: string | null } }
}>({})

function convertImageUrls() {
  for (const team of ['ColoColo', 'IndValle']) {
    for (const period of ['Full recording', '1st period', '2nd period']) {
      const gsUrl = mockData[team].heatMap[period]?.screenshot

      if (gsUrl && storageService.isGsUrl(gsUrl)) {
        const httpsUrl = storageService.convertGsUrlToHttps(gsUrl)
        imageUrls.value.heatMap[team][period] = httpsUrl
      }
    }
  }
}

onMounted(() => {
  convertImageUrls()
})
```

---

### 5.3 veoScrapeService.ts

**Ubicación**: `src/services/veoScrapeService.ts`

**Propósito**: Gestionar jobs de scraping de VEO y obtener analytics.

```typescript
class VeoScrapeService {
  /**
   * Dispara un job de scraping
   */
  async triggerScrapeJob(request: ScrapeJobRequest): Promise<{
    jobId: string
    status: string
    message: string
  }> {
    const response = await api.post('/api/scrape/match', request)
    return response.data
  }

  /**
   * Obtiene el estado de un job
   */
  async getJobStatus(jobId: string): Promise<ScrapeJob> {
    const response = await api.get(`/api/scrape/status/${jobId}`)
    return response.data
  }

  /**
   * Lista todos los jobs
   */
  async listJobs(options?: {
    limit?: number
    status?: string
    tournamentId?: string
  }): Promise<JobsListResponse> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.status) params.append('status', options.status)

    const response = await api.get(`/api/scrape/jobs?${params}`)
    return response.data
  }

  /**
   * Obtiene highlights de un partido
   */
  async getMatchHighlights(
    tournamentId: string,
    matchId: string,
    options?: {
      teams?: string[]
      tags?: string[]
      limit?: number
    }
  ): Promise<{
    tournament_id: string
    match_id: string
    highlights: unknown[]
    total: number
  }> {
    const params = new URLSearchParams()
    if (options?.teams) {
      options.teams.forEach(team => params.append('teams', team))
    }

    const response = await api.get(
      `/api/matches/${tournamentId}/${matchId}/highlights?${params}`
    )
    return response.data
  }
}

export default new VeoScrapeService()
```

---

## 6. Gestión de Estado

### 6.1 Pinia Stores

#### useMatchStore

**Ubicación**: `src/stores/matches.ts`

```typescript
export const useMatchStore = defineStore('matches', {
  state: () => ({
    items: [] as Match[],
    loading: false as boolean,
  }),

  actions: {
    async fetch(
      tournamentId: string,
      opts?: { status?: MatchStatus; phase?: MatchPhase }
    ) {
      this.loading = true
      try {
        this.items = await listMatchesByTournament(tournamentId, opts)
      } finally {
        this.loading = false
      }
    },

    async create(form: any) {
      const uid = useUserStore().user?.uid || ''
      const id = await createMatch(form, { uid })
      return id
    },

    async update(id: string, patch: Partial<Match>) {
      await updateMatch(id, patch)
      const idx = this.items.findIndex(m => m.id === id)
      if (idx >= 0) this.items[idx] = { ...this.items[idx], ...patch }
    }
  }
})
```

---

### 6.2 Composables

#### useTournamentSelection

**Ubicación**: `src/composables/useTournamentSelection.ts`

**Propósito**: Persistir selección de torneo en localStorage.

```typescript
export function useTournamentSelection(tournaments: Ref<Tournament[]>) {
  const selectedTournament = ref<Tournament | null>(null)
  const STORAGE_KEY = 'gol360_selected_tournament'

  function loadSavedTournament() {
    const savedId = localStorage.getItem(STORAGE_KEY)

    if (savedId && tournaments.value.length > 0) {
      const found = tournaments.value.find(t => t.tournamentId === savedId)
      if (found) {
        selectedTournament.value = found
        return true
      }
    }
    return false
  }

  function saveTournament(tournament: Tournament | null) {
    if (tournament) {
      localStorage.setItem(STORAGE_KEY, tournament.tournamentId)
      selectedTournament.value = tournament
    } else {
      localStorage.removeItem(STORAGE_KEY)
      selectedTournament.value = null
    }
  }

  function initializeSelection() {
    const loaded = loadSavedTournament()

    // Auto-seleccionar el primero si no hay guardado
    if (!loaded && tournaments.value.length > 0) {
      saveTournament(tournaments.value[0])
    }
  }

  // Watch para reinicializar cuando cambien torneos
  watch(
    () => tournaments.value.length,
    () => initializeSelection(),
    { immediate: true }
  )

  return {
    selectedTournament,
    updateSelection: saveTournament,
    clearSelection: () => saveTournament(null),
    initializeSelection
  }
}
```

---

## 7. Flujo de Datos

### 7.1 Flujo Completo: Carga de Analytics

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario abre TournamentStats.vue                         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. onMounted → cargar torneos desde Pinia store             │
│    tStore.fetch()                                            │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. useTournamentSelection → auto-seleccionar torneo          │
│    - Cargar desde localStorage                               │
│    - O seleccionar el primero                                │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. loadMatches(tournamentId)                                │
│    - mStore.fetch(tournamentId)                              │
│    - Convertir matches a MatchOption[]                       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Auto-seleccionar primer partido                          │
│    selectedMatch.value = matches[0]                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. loadAnalytics()                                          │
│    analyticsService.getMatchAnalytics(tournamentId, matchId)│
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. API Request                                              │
│    GET /gol360-api/api/matches/{tid}/{mid}/analytics        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Respuesta AnalyticsResponse                              │
│    {                                                         │
│      tournament_id, match_id, teams,                         │
│      data: { heatMap, highlights, playerMoments, ... }       │
│    }                                                         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Pasar data a paneles como props                          │
│    <AnalyticsPanel :analyticsData="analyticsData" />        │
│    <ClipsPanel :highlightsData="analyticsData.highlights" />│
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Paneles procesan y renderizan data                      │
│     - AnalyticsPanel: convierte gs:// URLs                  │
│     - ClipsPanel: genera lista de clips                     │
│     - DestacadosPanel: organiza por jugador                 │
└─────────────────────────────────────────────────────────────┘
```

---

### 7.2 Flujo de Navegación en YouTube

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario hace clic en un clip                                │
│ @click="goToYouTubeTimestamp(clip.timeInSeconds)"           │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Activar highlight visual                                │
│    isVideoHighlighted = true                                │
│    setTimeout(() => isVideoHighlighted = false, 2000)       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Scroll suave al reproductor                              │
│    videoCard.scrollIntoView({ behavior: 'smooth' })         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Esperar que termine el scroll (600ms)                    │
│    setTimeout(() => { ... }, 600)                           │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Enviar comando seekTo via YouTube IFrame API             │
│    youtubePlayer.contentWindow.postMessage({                │
│      event: 'command',                                      │
│      func: 'seekTo',                                        │
│      args: [timeInSeconds, true]                            │
│    }, '*')                                                  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Esperar 100ms y enviar comando playVideo                │
│    youtubePlayer.contentWindow.postMessage({                │
│      event: 'command',                                      │
│      func: 'playVideo',                                     │
│      args: []                                               │
│    }, '*')                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Integración con YouTube

### 8.1 YouTube IFrame API

**Documentación oficial**: https://developers.google.com/youtube/iframe_api_reference

#### Embed URL

```typescript
const youtubeEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${props.youtubeVideoId}?enablejsapi=1&rel=0&autoplay=0`
})
```

**Parámetros importantes**:
- `enablejsapi=1`: Habilita el control via JavaScript
- `rel=0`: No mostrar videos relacionados
- `autoplay=0`: No reproducir automáticamente al cargar

#### IFrame HTML

```html
<iframe
  ref="youtubePlayer"
  :src="youtubeEmbedUrl"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  class="youtube-iframe"
></iframe>
```

#### Comandos via postMessage

```typescript
// Saltar a timestamp
youtubePlayer.value.contentWindow.postMessage(
  JSON.stringify({
    event: 'command',
    func: 'seekTo',
    args: [timeInSeconds, true]  // allowSeekAhead = true
  }),
  '*'
)

// Reproducir
youtubePlayer.value.contentWindow.postMessage(
  JSON.stringify({
    event: 'command',
    func: 'playVideo',
    args: []
  }),
  '*'
)

// Pausar
youtubePlayer.value.contentWindow.postMessage(
  JSON.stringify({
    event: 'command',
    func: 'pauseVideo',
    args: []
  }),
  '*'
)
```

---

### 8.2 Scroll Suave al Video

```typescript
function scrollToVideo() {
  const videoCard = document.querySelector('.video-card')
  if (videoCard) {
    videoCard.scrollIntoView({
      behavior: 'smooth',
      block: 'center'       // Centrar verticalmente
    })
  }
}
```

---

### 8.3 Efecto de Highlight

```vue
<q-card class="video-card" :class="{ 'video-highlight': isVideoHighlighted }">
  <!-- Video iframe -->
</q-card>
```

```scss
.video-card {
  transition: all 0.3s ease;

  &.video-highlight {
    box-shadow: 0 0 0 4px #064F34, 0 8px 32px rgba(6, 79, 52, 0.3);
    transform: scale(1.02);
    animation: pulse 0.6s ease-in-out;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px #064F34, 0 8px 32px rgba(6, 79, 52, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px #138A59, 0 12px 40px rgba(19, 138, 89, 0.4);
  }
}
```

---

## 9. Conversión de URLs de Storage

### 9.1 Problema

Los analytics de la API retornan URLs de Google Cloud Storage en formato `gs://`:

```
gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_1st_period.png
```

Este formato no es accesible directamente desde el navegador.

---

### 9.2 Solución

Convertir a URLs HTTPS públicas:

```
https://storage.googleapis.com/gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/heat_map_1st_period.png
```

---

### 9.3 Implementación

```typescript
// storageService.ts
convertGsUrlToHttps(gsUrl: string): string {
  if (!gsUrl.startsWith('gs://')) {
    throw new Error('Invalid gs:// URL format')
  }

  return gsUrl.replace('gs://', 'https://storage.googleapis.com/')
}
```

---

### 9.4 Uso en Componentes

```typescript
// AnalyticsPanel.vue
const imageUrls = ref<{
  heatMap: { [team: string]: { [period: string]: string | null } }
}>({})

function convertImageUrls() {
  for (const team of ['ColoColo', 'IndValle']) {
    for (const period of ['Full recording', '1st period', '2nd period']) {
      const gsUrl = mockData[team].heatMap[period]?.screenshot

      if (gsUrl && storageService.isGsUrl(gsUrl)) {
        try {
          const httpsUrl = storageService.convertGsUrlToHttps(gsUrl)
          imageUrls.value.heatMap[team][period] = httpsUrl
        } catch (error) {
          console.error(`Failed to convert URL for ${team} ${period}:`, error)
          imageUrls.value.heatMap[team][period] = null
        }
      }
    }
  }
}

onMounted(() => {
  convertImageUrls()
})

// Computed que usa la URL convertida
const currentHeatMap = computed(() => {
  const heatMap = mockData[selectedTeam.value].heatMap[selectedPeriod.value]
  const convertedScreenshot = imageUrls.value.heatMap[selectedTeam.value]?.[selectedPeriod.value]

  return {
    ...heatMap,
    screenshot: convertedScreenshot || heatMap.screenshot
  }
})
```

---

## 10. Migración a Astro

### 10.1 Diferencias Clave entre Vue y Astro

| Aspecto | Vue 3 + Quasar | Astro |
|---------|---------------|-------|
| **Reactividad** | `ref()`, `computed()`, `watch()` | Island Components con `client:*` directives |
| **Estado Global** | Pinia stores | Nanostores o Context API |
| **Composables** | Composables de Vue | Utility functions (no reactivos) |
| **Componentes** | SFC (.vue) | `.astro` o framework components |
| **Routing** | Vue Router | File-based routing |
| **API Calls** | Axios en cliente | `fetch()` en server o cliente |

---

### 10.2 Arquitectura Recomendada para Astro

```
src/
├── pages/
│   └── tournaments/
│       └── [tournamentId]/
│           └── [matchId]/
│               └── stats.astro           # Página principal
│
├── components/
│   ├── analytics/
│   │   ├── AnalyticsPanel.astro         # Component Astro (Server)
│   │   ├── AnalyticsPanel.tsx           # O React/Preact (Client)
│   │   ├── ClipsPanel.tsx               # React para interactividad
│   │   └── DestacadosPanel.tsx          # React con auto-play
│   │
│   └── ui/
│       ├── TournamentSelector.tsx       # React component
│       └── MatchSelector.tsx            # React component
│
├── lib/
│   ├── services/
│   │   ├── analyticsService.ts          # Fetch-based API calls
│   │   ├── storageService.ts            # URL conversion
│   │   └── youtubeService.ts            # YouTube helpers
│   │
│   ├── stores/
│   │   ├── tournamentStore.ts           # Nanostores
│   │   └── matchStore.ts                # Nanostores
│   │
│   └── types/
│       └── analytics.ts                 # Types (reutilizar de Vue)
│
└── layouts/
    └── StatsLayout.astro                # Layout base
```

---

### 10.3 Conversión de Componentes

#### 10.3.1 TournamentStats.astro (Página Principal)

```astro
---
// stats.astro
import StatsLayout from '@/layouts/StatsLayout.astro'
import { getMatchAnalytics } from '@/lib/services/analyticsService'

const { tournamentId, matchId } = Astro.params

// Fetch data en el servidor (SSR)
let analyticsData = null
try {
  analyticsData = await getMatchAnalytics(tournamentId!, matchId!)
} catch (error) {
  console.error('Failed to load analytics:', error)
}
---

<StatsLayout title={`Stats - ${matchId}`}>
  <div class="tournament-stats-page">
    <!-- Selector de torneo/partido (React component con client:load) -->
    <TournamentSelector
      client:load
      initialTournament={tournamentId}
      initialMatch={matchId}
    />

    <!-- Tabs System (React component) -->
    <StatsTabs client:load analyticsData={analyticsData} />
  </div>
</StatsLayout>
```

---

#### 10.3.2 StatsTabs Component (React/Preact)

```tsx
// components/analytics/StatsTabs.tsx
import { useState } from 'react'
import { AnalyticsPanel } from './AnalyticsPanel'
import { ClipsPanel } from './ClipsPanel'
import { DestacadosPanel } from './DestacadosPanel'
import type { AnalyticsResponse } from '@/lib/types/analytics'

interface Props {
  analyticsData: AnalyticsResponse | null
}

export function StatsTabs({ analyticsData }: Props) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'clips' | 'destacados'>('analytics')

  return (
    <div className="stats-tabs">
      {/* Tab Navigation */}
      <div className="tabs-nav">
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={activeTab === 'clips' ? 'active' : ''}
          onClick={() => setActiveTab('clips')}
        >
          Clips
        </button>
        <button
          className={activeTab === 'destacados' ? 'active' : ''}
          onClick={() => setActiveTab('destacados')}
        >
          Destacados
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content">
        {activeTab === 'analytics' && (
          <AnalyticsPanel analyticsData={analyticsData} />
        )}
        {activeTab === 'clips' && (
          <ClipsPanel
            highlightsData={analyticsData?.data?.highlights}
            youtubeVideoId="DtD7GNuF3xQ"
          />
        )}
        {activeTab === 'destacados' && (
          <DestacadosPanel
            playerMomentsData={analyticsData?.data?.playerMoments}
            youtubeVideoId="DtD7GNuF3xQ"
          />
        )}
      </div>
    </div>
  )
}
```

---

#### 10.3.3 ClipsPanel Component (React)

```tsx
// components/analytics/ClipsPanel.tsx
import { useState, useRef, useEffect } from 'react'
import { storageService } from '@/lib/services/storageService'
import type { HighlightsEntry } from '@/lib/types/analytics'

interface Props {
  highlightsData?: HighlightsEntry[]
  youtubeVideoId: string
  loading?: boolean
}

export function ClipsPanel({ highlightsData, youtubeVideoId, loading }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<string>('ColoColo')
  const [isVideoHighlighted, setIsVideoHighlighted] = useState(false)
  const youtubePlayerRef = useRef<HTMLIFrameElement>(null)

  const currentClips = highlightsData?.find(entry => entry.team === selectedTeam)?.highlights || []

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0`

  function goToYouTubeTimestamp(timeInSeconds: number) {
    if (!youtubePlayerRef.current?.contentWindow) return

    // Highlight effect
    setIsVideoHighlighted(true)
    setTimeout(() => setIsVideoHighlighted(false), 2000)

    // Scroll to video
    youtubePlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Seek and play
    setTimeout(() => {
      const player = youtubePlayerRef.current?.contentWindow
      if (!player) return

      // Seek
      player.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [timeInSeconds, true]
      }), '*')

      // Play
      setTimeout(() => {
        player.postMessage(JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }), '*')
      }, 100)
    }, 600)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Cargando clips...</p>
      </div>
    )
  }

  return (
    <div className="clips-panel">
      {/* Team Selector */}
      <div className="team-selector">
        <button
          className={selectedTeam === 'ColoColo' ? 'active' : ''}
          onClick={() => setSelectedTeam('ColoColo')}
        >
          Colo Colo
        </button>
        <button
          className={selectedTeam === 'IndValle' ? 'active' : ''}
          onClick={() => setSelectedTeam('IndValle')}
        >
          Ind. Valle
        </button>
      </div>

      {/* YouTube Player */}
      <div className={`video-card ${isVideoHighlighted ? 'video-highlight' : ''}`}>
        <iframe
          ref={youtubePlayerRef}
          src={youtubeEmbedUrl}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="youtube-iframe"
        />
      </div>

      {/* Clips Grid */}
      <div className="clips-grid">
        {currentClips.map((clip, index) => (
          <div
            key={index}
            className="clip-card"
            onClick={() => goToYouTubeTimestamp(clip.timeInSeconds)}
          >
            <div className="clip-header">
              <span className="clip-index">#{clip.index}</span>
              <span className={`clip-tag ${getTagClass(clip.tag)}`}>
                {clip.tag}
              </span>
            </div>

            <div className="clip-body">
              <div className="clip-time">
                <span className="timecode">{clip.timecode}</span>
              </div>
            </div>

            <button
              className="clip-play-btn"
              onClick={() => goToYouTubeTimestamp(clip.timeInSeconds)}
            >
              Ver momento
            </button>

            {clip.videoUrl && (
              <div className="clip-thumbnail">
                <video
                  src={clip.videoUrl}
                  muted
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause()
                    e.currentTarget.currentTime = 0
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function getTagClass(tag: string): string {
  const tagClasses: Record<string, string> = {
    'Gol': 'tag-goal',
    'Tiro directo a portería': 'tag-shot',
    'Tiro de esquina': 'tag-corner',
    'Falta': 'tag-foul',
  }
  return tagClasses[tag] || 'tag-default'
}
```

---

#### 10.3.4 DestacadosPanel con Auto-Play (React)

```tsx
// components/analytics/DestacadosPanel.tsx
import { useState, useRef, useEffect } from 'react'
import type { PlayerMomentsEntry } from '@/lib/types/analytics'

interface Props {
  playerMomentsData?: PlayerMomentsEntry[]
  youtubeVideoId: string
  loading?: boolean
}

export function DestacadosPanel({ playerMomentsData, youtubeVideoId, loading }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0)
  const [countdown, setCountdown] = useState(15)
  const [progressPercent, setProgressPercent] = useState(0)

  const youtubePlayerRef = useRef<HTMLIFrameElement>(null)
  const countdownIntervalRef = useRef<number | null>(null)

  // Get all players from all teams
  const allPlayers = playerMomentsData?.flatMap(entry =>
    entry.data.map(player => ({
      ...player,
      key: `${entry.team}-${player.name}`
    }))
  ) || []

  const currentPlayerData = allPlayers.find(p => p.key === selectedPlayer)
  const currentMoments = currentPlayerData?.moments || []

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying) return

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1
        setProgressPercent(1 - (next / 15))

        if (next <= 0) {
          goToNextMoment()
          return 15
        }
        return next
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isAutoPlaying, currentMomentIndex])

  function startAutoPlay() {
    setIsAutoPlaying(true)
    setCountdown(15)
    setProgressPercent(0)
    goToMoment(currentMomentIndex)
  }

  function stopAutoPlay() {
    setIsAutoPlaying(false)
    setCountdown(15)
    setProgressPercent(0)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
  }

  function goToMoment(index: number) {
    setCurrentMomentIndex(index)
    const moment = currentMoments[index]
    if (!moment) return

    seekAndPlay(moment.startTimeInSeconds)

    if (isAutoPlaying) {
      setCountdown(15)
      setProgressPercent(0)
    }
  }

  function goToNextMoment() {
    const nextIndex = currentMomentIndex + 1
    if (nextIndex < currentMoments.length) {
      goToMoment(nextIndex)
    } else {
      goToMoment(0) // Loop back
    }
  }

  function seekAndPlay(timeInSeconds: number) {
    const player = youtubePlayerRef.current?.contentWindow
    if (!player) return

    player.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [timeInSeconds, true]
    }), '*')

    setTimeout(() => {
      player.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*')
    }, 100)
  }

  return (
    <div className="destacados-panel">
      {/* Player Selector */}
      <div className="player-selector">
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
        >
          <option value="">Selecciona un jugador</option>
          {allPlayers.map(player => (
            <option key={player.key} value={player.key}>
              {player.name} ({player.team})
            </option>
          ))}
        </select>
      </div>

      {selectedPlayer && (
        <>
          {/* Auto-play Controls */}
          <div className="autoplay-controls">
            {!isAutoPlaying ? (
              <button onClick={startAutoPlay}>
                Reproducción automática
              </button>
            ) : (
              <>
                <button onClick={stopAutoPlay}>
                  Detener automático
                </button>
                <span className="countdown">{countdown}s</span>
              </>
            )}
          </div>

          {/* YouTube Player */}
          <div className="video-card">
            <iframe
              ref={youtubePlayerRef}
              src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>

          {/* Moments List */}
          <div className="moments-list">
            {currentMoments.map((moment, index) => (
              <div
                key={index}
                className={`moment-card ${currentMomentIndex === index ? 'active' : ''}`}
                onClick={() => goToMoment(index)}
              >
                <div className="moment-index">#{index + 1}</div>
                <div className="moment-time">{moment.startTime}</div>
                <div className="moment-duration">{moment.duration}</div>

                {currentMomentIndex === index && isAutoPlaying && (
                  <div className="progress-bar" style={{ width: `${progressPercent * 100}%` }} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

---

### 10.4 Servicios en Astro

#### 10.4.1 analyticsService.ts (Astro version)

```typescript
// lib/services/analyticsService.ts
import type { AnalyticsResponse } from '@/lib/types/analytics'

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://gol360-api-947700853040.us-central1.run.app'

export async function getMatchAnalytics(
  tournamentId: string,
  matchId: string
): Promise<AnalyticsResponse> {
  const url = `${API_BASE_URL}/api/matches/${tournamentId}/${matchId}/analytics`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`)
  }

  return response.json()
}

export async function getMatchHighlights(tournamentId: string, matchId: string) {
  const data = await getMatchAnalytics(tournamentId, matchId)
  return data.data.highlights || []
}

export async function getMatchHeatMaps(tournamentId: string, matchId: string) {
  const data = await getMatchAnalytics(tournamentId, matchId)
  return data.data.heatMap || []
}
```

---

#### 10.4.2 storageService.ts (Reutilizable)

```typescript
// lib/services/storageService.ts
export const storageService = {
  convertGsUrlToHttps(gsUrl: string): string {
    if (!gsUrl.startsWith('gs://')) {
      throw new Error('Invalid gs:// URL format')
    }
    return gsUrl.replace('gs://', 'https://storage.googleapis.com/')
  },

  isGsUrl(url: string): boolean {
    return url.startsWith('gs://')
  },

  ensureHttpsUrl(url: string): string {
    if (this.isGsUrl(url)) {
      return this.convertGsUrlToHttps(url)
    }
    return url
  }
}
```

---

### 10.5 Estado Global con Nanostores

```typescript
// lib/stores/tournamentStore.ts
import { atom, computed } from 'nanostores'
import type { Tournament } from '@/lib/types/auth'

export const $tournaments = atom<Tournament[]>([])
export const $selectedTournament = atom<Tournament | null>(null)

// Load from localStorage
if (typeof window !== 'undefined') {
  const savedId = localStorage.getItem('gol360_selected_tournament')
  if (savedId) {
    $selectedTournament.subscribe(value => {
      if (value) {
        localStorage.setItem('gol360_selected_tournament', value.tournamentId)
      }
    })
  }
}

// Computed
export const $tournamentId = computed($selectedTournament, tournament =>
  tournament?.tournamentId || ''
)
```

**Uso en React components**:

```tsx
import { useStore } from '@nanostores/react'
import { $selectedTournament, $tournaments } from '@/lib/stores/tournamentStore'

function TournamentSelector() {
  const selectedTournament = useStore($selectedTournament)
  const tournaments = useStore($tournaments)

  return (
    <select value={selectedTournament?.tournamentId || ''}>
      {tournaments.map(t => (
        <option key={t.tournamentId} value={t.tournamentId}>
          {t.name}
        </option>
      ))}
    </select>
  )
}
```

---

### 10.6 Routing en Astro

```
src/pages/
└── tournaments/
    └── [tournamentId]/
        └── [matchId]/
            └── stats.astro
```

**Acceso**:
```
/tournaments/VeteranosTunja2025/LibVsColo/stats
```

**En el componente**:

```astro
---
const { tournamentId, matchId } = Astro.params
---
```

---

### 10.7 Estilos (CSS Modules o Tailwind)

#### Opción 1: CSS Modules

```astro
---
import styles from './stats.module.css'
---

<div class={styles.tournamentStatsPage}>
  <!-- Content -->
</div>
```

#### Opción 2: Tailwind CSS

```astro
<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Content -->
  </div>
</div>
```

---

### 10.8 Directivas de Cliente en Astro

```astro
---
import { StatsTabs } from '@/components/analytics/StatsTabs'
---

<!-- Cargar inmediatamente -->
<StatsTabs client:load analyticsData={data} />

<!-- Cargar cuando sea visible -->
<StatsTabs client:visible analyticsData={data} />

<!-- Cargar cuando el navegador esté idle -->
<StatsTabs client:idle analyticsData={data} />

<!-- Cargar solo en dispositivos móviles -->
<StatsTabs client:media="(max-width: 768px)" analyticsData={data} />
```

---

### 10.9 Optimizaciones para Astro

#### Server-Side Rendering (SSR)

```astro
---
// stats.astro
import { getMatchAnalytics } from '@/lib/services/analyticsService'

// Esto se ejecuta en el servidor
const { tournamentId, matchId } = Astro.params

const analyticsData = await getMatchAnalytics(tournamentId!, matchId!)
---

<!-- HTML pre-renderizado con los datos -->
<div>
  <h1>Stats para {matchId}</h1>
  <p>Equipos: {analyticsData.teams.join(' vs ')}</p>
</div>

<!-- JavaScript solo para interactividad -->
<StatsTabs client:load analyticsData={analyticsData} />
```

#### Image Optimization

```astro
---
import { Image } from 'astro:assets'
import { storageService } from '@/lib/services/storageService'

const gsUrl = 'gs://bucket/heat_map.png'
const httpsUrl = storageService.convertGsUrlToHttps(gsUrl)
---

<Image
  src={httpsUrl}
  alt="Heat map"
  width={800}
  height={450}
  loading="lazy"
/>
```

---

## 11. Checklist de Migración

### ✅ Preparación

- [ ] Instalar Astro: `npm create astro@latest`
- [ ] Elegir framework UI (React, Preact, Svelte, etc.)
- [ ] Configurar Tailwind o CSS framework
- [ ] Instalar Nanostores: `npm install nanostores @nanostores/react`

### ✅ Estructura de Archivos

- [ ] Crear carpetas: `lib/`, `components/`, `pages/`
- [ ] Configurar routing basado en archivos
- [ ] Migrar tipos TypeScript (reutilizables)

### ✅ Servicios

- [ ] Migrar `analyticsService.ts` (cambiar Axios por `fetch`)
- [ ] Copiar `storageService.ts` (sin cambios)
- [ ] Adaptar configuración de API base URL

### ✅ Componentes

- [ ] Convertir `TournamentStats.vue` → `stats.astro` (página)
- [ ] Convertir `AnalyticsPanel.vue` → `AnalyticsPanel.tsx` (React)
- [ ] Convertir `ClipsPanel.vue` → `ClipsPanel.tsx` (React)
- [ ] Convertir `DestacadosPanel.vue` → `DestacadosPanel.tsx` (React)
- [ ] Implementar selectores de torneo/partido

### ✅ Estado Global

- [ ] Migrar Pinia stores → Nanostores
- [ ] Implementar persistencia en localStorage
- [ ] Configurar `useStore` en components React

### ✅ Integración YouTube

- [ ] Implementar IFrame con `ref`
- [ ] Adaptar lógica de `postMessage`
- [ ] Probar navegación temporal

### ✅ Estilos

- [ ] Migrar estilos SCSS → CSS Modules o Tailwind
- [ ] Adaptar clases de Quasar
- [ ] Implementar responsive design

### ✅ Testing

- [ ] Probar carga de analytics
- [ ] Verificar conversión de URLs gs://
- [ ] Probar navegación en YouTube
- [ ] Verificar auto-play en Destacados
- [ ] Probar en móvil y desktop

---

## 12. Recursos Adicionales

### Documentación

- **Astro**: https://docs.astro.build
- **Nanostores**: https://github.com/nanostores/nanostores
- **YouTube IFrame API**: https://developers.google.com/youtube/iframe_api_reference
- **Google Cloud Storage**: https://cloud.google.com/storage/docs

### Repositorio GOL360

- **Backend API**: `gol360-api/`
- **Frontend Vue**: `Gol-360-App/`
- **Landing Astro**: `Gol-360-Landing/`

---

## Conclusión

Esta arquitectura proporciona un sistema completo para visualizar analytics deportivos con integración de video. La migración a Astro aprovecha SSR para mejor performance, mientras que los componentes React mantienen la interactividad necesaria para features como auto-play y navegación temporal en YouTube.

**Ventajas de la migración a Astro**:
- ✅ Mejor performance (menos JavaScript enviado al cliente)
- ✅ SEO optimizado con SSR
- ✅ Hydration parcial (solo componentes interactivos)
- ✅ File-based routing más simple
- ✅ Compatible con múltiples frameworks (React, Vue, Svelte)

**Próximos pasos**:
1. Implementar página base en Astro
2. Migrar servicios y tipos
3. Convertir componentes a React/Preact
4. Integrar Nanostores para estado
5. Testing y optimización
