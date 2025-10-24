# Mapa de Ruta: Integración Firestore para Player Tracking y Datos Scraped

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura Propuesta](#arquitectura-propuesta)
3. [Fase 1: Backend - Subida a Firestore](#fase-1-backend---subida-a-firestore)
4. [Fase 2: Backend - Cloud Storage para Tracking](#fase-2-backend---cloud-storage-para-tracking)
5. [Fase 3: Frontend - Servicios](#fase-3-frontend---servicios)
6. [Fase 4: Frontend - Composables y State](#fase-4-frontend---composables-y-state)
7. [Fase 5: Frontend - Componentes de Visualización](#fase-5-frontend---componentes-de-visualización)
8. [Testing y Validación](#testing-y-validación)
9. [Deployment](#deployment)

---

## Visión General

### Objetivo
Conectar el scraper de Veo.co con Firestore para:
1. Almacenar datos estructurados (stats, moments, highlights, players) en Firestore
2. Almacenar archivos grandes (player tracking ~4MB) en Cloud Storage con URLs públicas
3. Consumir datos desde el frontend Gol-360-App (Quasar/Vue 3)

### Estado Actual
✅ **Scraper funcionando**: Genera archivos JSON completos con todos los datos
✅ **Frontend conectado a Firestore**: Ya usa Firebase para matches, tournaments, teams
✅ **Firebase Functions existentes**: Ya hay functions para procesar HTML (`parseVeo`, `processScrapedData`)

### Lo que Falta
🔲 Modificar scraper para subir JSON consolidado a Cloud Storage
🔲 Crear Firebase Function para procesar JSON consolidado
🔲 Almacenar player-tracking.json en Cloud Storage con URL público
🔲 Crear servicios en frontend para consumir datos
🔲 Crear composables y componentes de visualización

---

## Arquitectura Propuesta

### Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SCRAPER (ingest/)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Scrape Veo.co                                                    │
│     ├─ Home Team: stats, shotMap, heatMap, playerMoments, highlights│
│     ├─ Away Team: stats, shotMap, heatMap, playerMoments, highlights│
│     └─ Player Tracking: consolidado de ambos equipos (38 jugadores) │
│                                                                       │
│  2. Genera archivos locales (output/)                                │
│     ├─ {TOURNAMENT}_{MATCH}_{TIMESTAMP}.json       (~13 MB)         │
│     └─ {TOURNAMENT}_{MATCH}_player-tracking.json   (~4 MB)          │
│                                                                       │
│  3. Sube a Google Cloud Storage                                      │
│     gs://{BUCKET}/raw/{TOURNAMENT}/{MATCH}/                          │
│     ├─ match-data.json              (datos principales)             │
│     └─ player-tracking.json         (tracking consolidado)          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Cloud Storage Trigger
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FIREBASE FUNCTION (functions/)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  processMatchData (NEW)                                              │
│  - Trigger: onObjectFinalized('match-data.json')                     │
│  - Lee JSON de GCS                                                   │
│  - Procesa y estructura datos                                        │
│  - Guarda en Firestore:                                              │
│                                                                       │
│    tournaments/{tournamentId}/                                       │
│      └─ matches/{matchId}/                                           │
│           ├─ metadata (doc)                                          │
│           ├─ stats/                                                  │
│           │   ├─ home (doc)                                          │
│           │   └─ away (doc)                                          │
│           ├─ shotMaps/                                               │
│           │   ├─ home (doc)                                          │
│           │   └─ away (doc)                                          │
│           ├─ heatMaps/                                               │
│           │   ├─ home (doc)                                          │
│           │   └─ away (doc)                                          │
│           ├─ playerMoments/                                          │
│           │   ├─ {playerId} (docs)                                   │
│           │   └─ ...                                                 │
│           ├─ highlights/                                             │
│           │   ├─ {highlightId} (docs)                                │
│           │   └─ ...                                                 │
│           └─ tracking/                                               │
│               └─ metadata (doc con URL a player-tracking.json)       │
│                                                                       │
│  - Genera signed URL público para player-tracking.json (7 días)     │
│  - Guarda URL en tracking/metadata                                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Frontend queries Firestore
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Gol-360-App/)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Services (src/services/)                                            │
│  ├─ matchAnalyticsService.ts   (NEW)                                │
│  ├─ playerTrackingService.ts   (NEW)                                │
│  └─ matchService.ts             (EXTEND)                             │
│                                                                       │
│  Composables (src/composables/)                                      │
│  ├─ useMatchAnalytics.ts        (NEW)                                │
│  ├─ usePlayerTracking.ts        (NEW)                                │
│  └─ useMatchStats.ts            (NEW)                                │
│                                                                       │
│  Components (src/components/)                                        │
│  ├─ match/                                                           │
│  │   ├─ MatchStats.vue          (NEW)                                │
│  │   ├─ ShotMap.vue             (NEW)                                │
│  │   ├─ HeatMap.vue             (NEW)                                │
│  │   └─ PlayerMoments.vue       (NEW)                                │
│  └─ tracking/                                                        │
│      ├─ PlayerTrackingOverlay.vue  (NEW)                             │
│      ├─ TacticalMiniMap.vue        (NEW)                             │
│      └─ TrackingTimeline.vue       (NEW)                             │
│                                                                       │
│  Pages (src/pages/)                                                  │
│  └─ MatchAnalyticsPage.vue      (NEW)                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Backend - Subida a Firestore

### 1.1 Modificar Scraper para Subir a GCS

**Archivo**: `ingest/src/scrape.js`

**Cambios**:
```javascript
// Al final del scraping, después de generar archivos locales:

// 1. Subir match-data.json (JSON principal sin tracking)
const matchDataToUpload = {
  metadata: SCRAPED_DATA.metadata,
  home: SCRAPED_DATA.home,
  away: SCRAPED_DATA.away
  // NO incluir playerTracking aquí (muy grande)
};

await uploadBuffer(
  config.RAW_BUCKET,
  `raw/${config.TOURNAMENT_ID}/${config.MATCH_ID}/match-data.json`,
  Buffer.from(JSON.stringify(matchDataToUpload), 'utf8'),
  { contentType: 'application/json' }
);

// 2. Subir player-tracking.json por separado
if (SCRAPED_DATA.playerTracking) {
  await uploadBuffer(
    config.RAW_BUCKET,
    `raw/${config.TOURNAMENT_ID}/${config.MATCH_ID}/player-tracking.json`,
    Buffer.from(JSON.stringify(SCRAPED_DATA.playerTracking), 'utf8'),
    { contentType: 'application/json' }
  );
}
```

**Resultado esperado**:
```
gs://gol360-scrape-raw-prod/raw/Veteranos2025/JenesanoVsTibana/
├── match-data.json           (~9 MB sin tracking)
└── player-tracking.json      (~4 MB)
```

### 1.2 Crear Firebase Function: processMatchData

**Archivo**: `functions/processMatchData.js` (NUEVO)

```javascript
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

const app = initializeApp();
const db = getFirestore();
const storage = new Storage();

export const processMatchData = onObjectFinalized({
  bucket: 'gol360-scrape-raw-prod',
  region: 'us-central1'
}, async (event) => {
  const filePath = event.data.name;

  // Solo procesar match-data.json
  if (!filePath.endsWith('/match-data.json')) {
    console.log('[processMatchData] Skipping non-match-data file:', filePath);
    return;
  }

  console.log('[processMatchData] Processing:', filePath);

  // Extraer metadata del path
  // raw/{tournamentId}/{matchId}/match-data.json
  const match = filePath.match(/^raw\/([^\/]+)\/([^\/]+)\/match-data\.json$/);
  if (!match) {
    console.warn('[processMatchData] Invalid path format:', filePath);
    return;
  }

  const [, tournamentId, matchId] = match;

  // Descargar y parsear JSON
  const bucket = storage.bucket(event.data.bucket);
  const file = bucket.file(filePath);
  const [buffer] = await file.download();
  const matchData = JSON.parse(buffer.toString('utf8'));

  // Guardar en Firestore
  await saveMatchDataToFirestore(tournamentId, matchId, matchData);

  // Generar URL público para player-tracking.json
  await generateTrackingUrl(tournamentId, matchId, event.data.bucket);

  console.log('[processMatchData] ✓ Successfully processed:', matchId);
});

async function saveMatchDataToFirestore(tournamentId, matchId, data) {
  const matchRef = db
    .collection('tournaments').doc(tournamentId)
    .collection('matches').doc(matchId);

  // 1. Guardar metadata del match
  await matchRef.set({
    ...data.metadata,
    scrapedDataAvailable: true,
    lastScraped: FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. Guardar stats (home y away)
  if (data.home?.stats) {
    await matchRef.collection('stats').doc('home').set({
      team: data.metadata.HOME_TEAM,
      stats: data.home.stats,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  if (data.away?.stats) {
    await matchRef.collection('stats').doc('away').set({
      team: data.metadata.AWAY_TEAM,
      stats: data.away.stats,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  // 3. Guardar shot maps
  if (data.home?.shotMap) {
    await matchRef.collection('shotMaps').doc('home').set({
      team: data.metadata.HOME_TEAM,
      data: data.home.shotMap,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  if (data.away?.shotMap) {
    await matchRef.collection('shotMaps').doc('away').set({
      team: data.metadata.AWAY_TEAM,
      data: data.away.shotMap,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  // 4. Guardar heat maps
  if (data.home?.heatMap) {
    await matchRef.collection('heatMaps').doc('home').set({
      team: data.metadata.HOME_TEAM,
      data: data.home.heatMap,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  if (data.away?.heatMap) {
    await matchRef.collection('heatMaps').doc('away').set({
      team: data.metadata.AWAY_TEAM,
      data: data.away.heatMap,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  // 5. Guardar player moments (batch write)
  const batch = db.batch();

  if (data.home?.playerMoments) {
    data.home.playerMoments.forEach((player, idx) => {
      const playerRef = matchRef.collection('playerMoments').doc(`home_${idx}`);
      batch.set(playerRef, {
        team: data.metadata.HOME_TEAM,
        side: 'home',
        playerName: player.namePlayer,
        moments: player.moments || [],
        totalMoments: player.moments?.length || 0,
        updatedAt: FieldValue.serverTimestamp()
      });
    });
  }

  if (data.away?.playerMoments) {
    data.away.playerMoments.forEach((player, idx) => {
      const playerRef = matchRef.collection('playerMoments').doc(`away_${idx}`);
      batch.set(playerRef, {
        team: data.metadata.AWAY_TEAM,
        side: 'away',
        playerName: player.namePlayer,
        moments: player.moments || [],
        totalMoments: player.moments?.length || 0,
        updatedAt: FieldValue.serverTimestamp()
      });
    });
  }

  await batch.commit();

  // 6. Guardar highlights
  const highlightsBatch = db.batch();

  if (data.home?.highlights) {
    data.home.highlights.forEach((highlight, idx) => {
      const hlRef = matchRef.collection('highlights').doc(`home_${idx}`);
      highlightsBatch.set(hlRef, {
        team: data.metadata.HOME_TEAM,
        side: 'home',
        ...highlight,
        updatedAt: FieldValue.serverTimestamp()
      });
    });
  }

  if (data.away?.highlights) {
    data.away.highlights.forEach((highlight, idx) => {
      const hlRef = matchRef.collection('highlights').doc(`away_${idx}`);
      highlightsBatch.set(hlRef, {
        team: data.metadata.AWAY_TEAM,
        side: 'away',
        ...highlight,
        updatedAt: FieldValue.serverTimestamp()
      });
    });
  }

  await highlightsBatch.commit();
}

async function generateTrackingUrl(tournamentId, matchId, bucketName) {
  const trackingPath = `raw/${tournamentId}/${matchId}/player-tracking.json`;

  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(trackingPath);

    // Verificar que el archivo existe
    const [exists] = await file.exists();
    if (!exists) {
      console.warn('[generateTrackingUrl] player-tracking.json not found:', trackingPath);
      return;
    }

    // Generar signed URL (válido por 7 días)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Obtener metadata del archivo
    const [metadata] = await file.getMetadata();
    const fileSizeBytes = parseInt(metadata.size);
    const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2);

    // Guardar URL y metadata en Firestore
    const matchRef = db
      .collection('tournaments').doc(tournamentId)
      .collection('matches').doc(matchId);

    await matchRef.collection('tracking').doc('metadata').set({
      url: url,
      urlExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      gcsPath: `gs://${bucketName}/${trackingPath}`,
      fileSizeMB: parseFloat(fileSizeMB),
      fileSizeBytes: fileSizeBytes,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(`[generateTrackingUrl] ✓ Generated tracking URL (${fileSizeMB} MB)`);

  } catch (error) {
    console.error('[generateTrackingUrl] Error:', error);
  }
}
```

**Exportar en `functions/index.js`**:
```javascript
export { processMatchData } from './processMatchData.js';
```

### 1.3 Actualizar Firestore Rules

**Archivo**: `api/firestore.rules`

Agregar reglas para las nuevas colecciones:

```javascript
// Dentro de match /tournaments/{tournamentId}/matches/{matchId}

// Stats subcollection
match /stats/{statId} {
  allow read: if true;
  allow write: if false; // Solo Cloud Functions
}

// Shot Maps subcollection
match /shotMaps/{mapId} {
  allow read: if true;
  allow write: if false;
}

// Heat Maps subcollection
match /heatMaps/{mapId} {
  allow read: if true;
  allow write: if false;
}

// Player Moments subcollection
match /playerMoments/{playerId} {
  allow read: if true;
  allow write: if false;
}

// Highlights subcollection
match /highlights/{highlightId} {
  allow read: if true;
  allow write: if false;
}

// Tracking metadata subcollection
match /tracking/{docId} {
  allow read: if true;
  allow write: if false;
}
```

---

## Fase 2: Backend - Cloud Storage para Tracking

### 2.1 Configurar CORS en Cloud Storage

Para permitir que el frontend descargue archivos desde Cloud Storage:

**Crear archivo**: `storage-cors.json`
```json
[
  {
    "origin": ["https://gol360.app", "http://localhost:9000"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

**Aplicar CORS**:
```bash
gsutil cors set storage-cors.json gs://gol360-scrape-raw-prod
```

### 2.2 Estrategia de Carga de Tracking

**Opción 1: Signed URL (Recomendado)**
- ✅ Seguro - URL expira después de 7 días
- ✅ No requiere autenticación en frontend
- ✅ Funciona con fetch/axios directo
- ⚠️ Requiere regenerar URL periódicamente

**Opción 2: Public URL**
- ✅ Permanente
- ⚠️ Menos seguro
- ⚠️ Archivo accesible públicamente

**Implementación en Frontend** (Opción 1):
```typescript
// src/services/playerTrackingService.ts
export async function fetchPlayerTracking(tournamentId: string, matchId: string) {
  // 1. Obtener metadata con URL desde Firestore
  const trackingRef = doc(
    db,
    'tournaments',
    tournamentId,
    'matches',
    matchId,
    'tracking',
    'metadata'
  );

  const trackingSnap = await getDoc(trackingRef);
  if (!trackingSnap.exists()) {
    throw new Error('Tracking metadata not found');
  }

  const { url, urlExpiresAt } = trackingSnap.data();

  // 2. Verificar si URL está vigente
  if (new Date(urlExpiresAt.toDate()) < new Date()) {
    throw new Error('Tracking URL expired - regenerate required');
  }

  // 3. Descargar tracking desde signed URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tracking: ${response.statusText}`);
  }

  const trackingData = await response.json();
  return trackingData;
}
```

---

## Fase 3: Frontend - Servicios

### 3.1 Match Analytics Service

**Archivo**: `Gol-360-App/src/services/matchAnalyticsService.ts` (NUEVO)

```typescript
import { db } from '@/boot/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData
} from 'firebase/firestore';

export interface MatchStats {
  team: string;
  stats: Array<{
    name: string;
    home: string | number;
    away: string | number;
  }>;
  updatedAt: Date;
}

export interface ShotMapData {
  team: string;
  data: Array<{
    period: string;
    goals: string;
    shots: string;
    total: string;
    conversionRate: string;
    screenshot?: string;
  }>;
  updatedAt: Date;
}

export interface HeatMapData {
  team: string;
  data: Array<{
    period: string;
    screenshot?: string;
  }>;
  updatedAt: Date;
}

export interface PlayerMoment {
  team: string;
  side: 'home' | 'away';
  playerName: string;
  moments: Array<{
    startTime: string;
    duration: string;
    trackingStart?: number;
    trackingEnd?: number;
    name?: string;
  }>;
  totalMoments: number;
  updatedAt: Date;
}

export interface Highlight {
  team: string;
  side: 'home' | 'away';
  team_name: string;
  index: number;
  tag: string;
  timecode: string;
  json: string;
  updatedAt: Date;
}

/**
 * Obtiene las estadísticas de un partido (home o away)
 */
export async function getMatchStats(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<MatchStats | null> {
  try {
    const statsRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'stats',
      side
    );

    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      return null;
    }

    return statsSnap.data() as MatchStats;
  } catch (error) {
    console.error('[getMatchStats] Error:', error);
    throw error;
  }
}

/**
 * Obtiene shot map de un partido (home o away)
 */
export async function getShotMap(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<ShotMapData | null> {
  try {
    const shotMapRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'shotMaps',
      side
    );

    const shotMapSnap = await getDoc(shotMapRef);

    if (!shotMapSnap.exists()) {
      return null;
    }

    return shotMapSnap.data() as ShotMapData;
  } catch (error) {
    console.error('[getShotMap] Error:', error);
    throw error;
  }
}

/**
 * Obtiene heat map de un partido (home o away)
 */
export async function getHeatMap(
  tournamentId: string,
  matchId: string,
  side: 'home' | 'away'
): Promise<HeatMapData | null> {
  try {
    const heatMapRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'heatMaps',
      side
    );

    const heatMapSnap = await getDoc(heatMapRef);

    if (!heatMapSnap.exists()) {
      return null;
    }

    return heatMapSnap.data() as HeatMapData;
  } catch (error) {
    console.error('[getHeatMap] Error:', error);
    throw error;
  }
}

/**
 * Obtiene todos los player moments de un partido
 */
export async function getPlayerMoments(
  tournamentId: string,
  matchId: string,
  side?: 'home' | 'away'
): Promise<PlayerMoment[]> {
  try {
    const momentsCol = collection(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'playerMoments'
    );

    let q = query(momentsCol);

    if (side) {
      q = query(momentsCol, where('side', '==', side));
    }

    const momentsSnap = await getDocs(q);

    return momentsSnap.docs.map(doc => doc.data() as PlayerMoment);
  } catch (error) {
    console.error('[getPlayerMoments] Error:', error);
    throw error;
  }
}

/**
 * Obtiene todos los highlights de un partido
 */
export async function getHighlights(
  tournamentId: string,
  matchId: string,
  side?: 'home' | 'away'
): Promise<Highlight[]> {
  try {
    const highlightsCol = collection(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'highlights'
    );

    let q = query(highlightsCol);

    if (side) {
      q = query(highlightsCol, where('side', '==', side));
    }

    const highlightsSnap = await getDocs(q);

    return highlightsSnap.docs.map(doc => doc.data() as Highlight);
  } catch (error) {
    console.error('[getHighlights] Error:', error);
    throw error;
  }
}

/**
 * Obtiene todos los datos de analytics de un partido
 */
export async function getAllMatchAnalytics(
  tournamentId: string,
  matchId: string
) {
  try {
    const [homeStats, awayStats, homeShotMap, awayShotMap, homeHeatMap, awayHeatMap, playerMoments, highlights] = await Promise.all([
      getMatchStats(tournamentId, matchId, 'home'),
      getMatchStats(tournamentId, matchId, 'away'),
      getShotMap(tournamentId, matchId, 'home'),
      getShotMap(tournamentId, matchId, 'away'),
      getHeatMap(tournamentId, matchId, 'home'),
      getHeatMap(tournamentId, matchId, 'away'),
      getPlayerMoments(tournamentId, matchId),
      getHighlights(tournamentId, matchId)
    ]);

    return {
      stats: { home: homeStats, away: awayStats },
      shotMaps: { home: homeShotMap, away: awayShotMap },
      heatMaps: { home: homeHeatMap, away: awayHeatMap },
      playerMoments,
      highlights
    };
  } catch (error) {
    console.error('[getAllMatchAnalytics] Error:', error);
    throw error;
  }
}
```

### 3.2 Player Tracking Service

**Archivo**: `Gol-360-App/src/services/playerTrackingService.ts` (NUEVO)

```typescript
import { db } from '@/boot/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface TrackingMetadata {
  url: string;
  urlExpiresAt: Date;
  gcsPath: string;
  fileSizeMB: number;
  fileSizeBytes: number;
  createdAt: Date;
}

export interface PlayerTrackingData {
  [timestamp: string]: Array<[
    string,  // playerId
    number,  // teamId
    number,  // x
    number,  // y
    number   // jerseyNumber
  ]>;
}

/**
 * Obtiene metadata del tracking (URL, tamaño, etc.)
 */
export async function getTrackingMetadata(
  tournamentId: string,
  matchId: string
): Promise<TrackingMetadata | null> {
  try {
    const trackingRef = doc(
      db,
      'tournaments',
      tournamentId,
      'matches',
      matchId,
      'tracking',
      'metadata'
    );

    const trackingSnap = await getDoc(trackingRef);

    if (!trackingSnap.exists()) {
      return null;
    }

    const data = trackingSnap.data();

    return {
      url: data.url,
      urlExpiresAt: data.urlExpiresAt.toDate(),
      gcsPath: data.gcsPath,
      fileSizeMB: data.fileSizeMB,
      fileSizeBytes: data.fileSizeBytes,
      createdAt: data.createdAt.toDate()
    };
  } catch (error) {
    console.error('[getTrackingMetadata] Error:', error);
    throw error;
  }
}

/**
 * Descarga el archivo completo de tracking desde Cloud Storage
 */
export async function fetchFullTracking(
  tournamentId: string,
  matchId: string
): Promise<PlayerTrackingData> {
  try {
    // 1. Obtener metadata con URL
    const metadata = await getTrackingMetadata(tournamentId, matchId);

    if (!metadata) {
      throw new Error('Tracking metadata not found');
    }

    // 2. Verificar si URL está vigente
    if (metadata.urlExpiresAt < new Date()) {
      throw new Error('Tracking URL expired - contact support to regenerate');
    }

    console.log(`[fetchFullTracking] Downloading ${metadata.fileSizeMB} MB...`);

    // 3. Descargar desde signed URL
    const response = await fetch(metadata.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch tracking: ${response.statusText}`);
    }

    const trackingData = await response.json();

    console.log(`[fetchFullTracking] ✓ Downloaded ${Object.keys(trackingData).length} frames`);

    return trackingData;
  } catch (error) {
    console.error('[fetchFullTracking] Error:', error);
    throw error;
  }
}

/**
 * Obtiene tracking para un rango de tiempo específico
 */
export function getTrackingRange(
  trackingData: PlayerTrackingData,
  startSeconds: number,
  endSeconds: number
): PlayerTrackingData {
  const filtered: PlayerTrackingData = {};

  for (const timestamp in trackingData) {
    const ts = parseFloat(timestamp);
    if (ts >= startSeconds && ts <= endSeconds) {
      filtered[timestamp] = trackingData[timestamp];
    }
  }

  return filtered;
}

/**
 * Filtra tracking por jugador específico
 */
export function getPlayerTracking(
  trackingData: PlayerTrackingData,
  playerId: string
): PlayerTrackingData {
  const filtered: PlayerTrackingData = {};

  for (const timestamp in trackingData) {
    const playerTracks = trackingData[timestamp].filter(
      track => track[0] === playerId
    );

    if (playerTracks.length > 0) {
      filtered[timestamp] = playerTracks;
    }
  }

  return filtered;
}

/**
 * Filtra tracking por equipo (teamId)
 */
export function getTeamTracking(
  trackingData: PlayerTrackingData,
  teamId: 0 | 1 | 2 | 3
): PlayerTrackingData {
  const filtered: PlayerTrackingData = {};

  for (const timestamp in trackingData) {
    const teamTracks = trackingData[timestamp].filter(
      track => track[1] === teamId
    );

    if (teamTracks.length > 0) {
      filtered[timestamp] = teamTracks;
    }
  }

  return filtered;
}
```

---

## Fase 4: Frontend - Composables y State

### 4.1 Composable: useMatchAnalytics

**Archivo**: `Gol-360-App/src/composables/useMatchAnalytics.ts` (NUEVO)

```typescript
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import {
  getAllMatchAnalytics,
  getMatchStats,
  getShotMap,
  getHeatMap,
  getPlayerMoments,
  getHighlights,
  type MatchStats,
  type ShotMapData,
  type HeatMapData,
  type PlayerMoment,
  type Highlight
} from '@/services/matchAnalyticsService';

export function useMatchAnalytics(tournamentId: Ref<string>, matchId: Ref<string>) {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const homeStats = ref<MatchStats | null>(null);
  const awayStats = ref<MatchStats | null>(null);
  const homeShotMap = ref<ShotMapData | null>(null);
  const awayShotMap = ref<ShotMapData | null>(null);
  const homeHeatMap = ref<HeatMapData | null>(null);
  const awayHeatMap = ref<HeatMapData | null>(null);
  const playerMoments = ref<PlayerMoment[]>([]);
  const highlights = ref<Highlight[]>([]);

  const hasData = computed(() =>
    homeStats.value !== null || awayStats.value !== null
  );

  async function loadAll() {
    loading.value = true;
    error.value = null;

    try {
      const data = await getAllMatchAnalytics(
        tournamentId.value,
        matchId.value
      );

      homeStats.value = data.stats.home;
      awayStats.value = data.stats.away;
      homeShotMap.value = data.shotMaps.home;
      awayShotMap.value = data.shotMaps.away;
      homeHeatMap.value = data.heatMaps.home;
      awayHeatMap.value = data.heatMaps.away;
      playerMoments.value = data.playerMoments;
      highlights.value = data.highlights;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMatchAnalytics] Error loading analytics:', err);
    } finally {
      loading.value = false;
    }
  }

  async function loadStats() {
    loading.value = true;
    error.value = null;

    try {
      const [home, away] = await Promise.all([
        getMatchStats(tournamentId.value, matchId.value, 'home'),
        getMatchStats(tournamentId.value, matchId.value, 'away')
      ]);

      homeStats.value = home;
      awayStats.value = away;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    loading,
    error,
    homeStats,
    awayStats,
    homeShotMap,
    awayShotMap,
    homeHeatMap,
    awayHeatMap,
    playerMoments,
    highlights,
    hasData,

    // Actions
    loadAll,
    loadStats
  };
}
```

### 4.2 Composable: usePlayerTracking

**Archivo**: `Gol-360-App/src/composables/usePlayerTracking.ts` (NUEVO)

```typescript
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import {
  getTrackingMetadata,
  fetchFullTracking,
  getTrackingRange,
  getPlayerTracking,
  getTeamTracking,
  type TrackingMetadata,
  type PlayerTrackingData
} from '@/services/playerTrackingService';

export function usePlayerTracking(tournamentId: Ref<string>, matchId: Ref<string>) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const metadata = ref<TrackingMetadata | null>(null);
  const trackingData = ref<PlayerTrackingData | null>(null);

  const isLoaded = computed(() => trackingData.value !== null);
  const totalFrames = computed(() =>
    trackingData.value ? Object.keys(trackingData.value).length : 0
  );

  async function loadMetadata() {
    loading.value = true;
    error.value = null;

    try {
      metadata.value = await getTrackingMetadata(
        tournamentId.value,
        matchId.value
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  async function loadTracking() {
    loading.value = true;
    error.value = null;

    try {
      trackingData.value = await fetchFullTracking(
        tournamentId.value,
        matchId.value
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  function getRange(startSeconds: number, endSeconds: number) {
    if (!trackingData.value) return null;
    return getTrackingRange(trackingData.value, startSeconds, endSeconds);
  }

  function getPlayer(playerId: string) {
    if (!trackingData.value) return null;
    return getPlayerTracking(trackingData.value, playerId);
  }

  function getTeam(teamId: 0 | 1 | 2 | 3) {
    if (!trackingData.value) return null;
    return getTeamTracking(trackingData.value, teamId);
  }

  return {
    // State
    loading,
    error,
    metadata,
    trackingData,
    isLoaded,
    totalFrames,

    // Actions
    loadMetadata,
    loadTracking,
    getRange,
    getPlayer,
    getTeam
  };
}
```

---

## Fase 5: Frontend - Componentes de Visualización

### 5.1 Componente: MatchStats.vue

**Archivo**: `Gol-360-App/src/components/match/MatchStats.vue` (NUEVO)

```vue
<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Estadísticas del Partido</div>
    </q-card-section>

    <q-card-section v-if="loading">
      <q-spinner color="primary" size="50px" />
    </q-card-section>

    <q-card-section v-else-if="error">
      <q-banner class="bg-negative text-white">
        {{ error }}
      </q-banner>
    </q-card-section>

    <q-card-section v-else-if="homeStats && awayStats">
      <div class="stats-grid">
        <div class="stat-row" v-for="stat in homeStats.stats" :key="stat.name">
          <div class="stat-home">{{ stat.home }}</div>
          <div class="stat-name">{{ stat.name }}</div>
          <div class="stat-away">{{ stat.away }}</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MatchStats } from '@/services/matchAnalyticsService';

interface Props {
  homeStats: MatchStats | null;
  awayStats: MatchStats | null;
  loading?: boolean;
  error?: string | null;
}

const props = defineProps<Props>();
</script>

<style scoped>
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: 16px;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.stat-home {
  text-align: right;
  font-weight: bold;
  color: #1976d2;
}

.stat-name {
  text-align: center;
  color: #666;
}

.stat-away {
  text-align: left;
  font-weight: bold;
  color: #d32f2f;
}
</style>
```

### 5.2 Página: MatchAnalyticsPage.vue

**Archivo**: `Gol-360-App/src/pages/MatchAnalyticsPage.vue` (NUEVO)

```vue
<template>
  <q-page padding>
    <div class="q-gutter-md">
      <div class="text-h4">Análisis del Partido</div>

      <!-- Match Stats -->
      <MatchStats
        :home-stats="homeStats"
        :away-stats="awayStats"
        :loading="loading"
        :error="error"
      />

      <!-- Shot Maps -->
      <q-card v-if="homeShotMap || awayShotMap">
        <q-card-section>
          <div class="text-h6">Mapa de Tiros</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-gutter-md">
            <div class="col">
              <div class="text-subtitle2">{{ homeShotMap?.team }}</div>
              <!-- Render shot map data -->
            </div>
            <div class="col">
              <div class="text-subtitle2">{{ awayShotMap?.team }}</div>
              <!-- Render shot map data -->
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Player Tracking -->
      <q-card>
        <q-card-section>
          <div class="text-h6">Tracking de Jugadores</div>
        </q-card-section>
        <q-card-section v-if="trackingMetadata">
          <div>Tamaño: {{ trackingMetadata.fileSizeMB }} MB</div>
          <div>Total frames: {{ totalFrames }}</div>
          <q-btn
            v-if="!isTrackingLoaded"
            @click="loadTracking"
            label="Cargar Tracking"
            color="primary"
            :loading="trackingLoading"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMatchAnalytics } from '@/composables/useMatchAnalytics';
import { usePlayerTracking } from '@/composables/usePlayerTracking';
import MatchStats from '@/components/match/MatchStats.vue';

const route = useRoute();
const tournamentId = ref(route.params.tournamentId as string);
const matchId = ref(route.params.matchId as string);

const {
  loading,
  error,
  homeStats,
  awayStats,
  homeShotMap,
  awayShotMap,
  playerMoments,
  highlights,
  loadAll
} = useMatchAnalytics(tournamentId, matchId);

const {
  loading: trackingLoading,
  metadata: trackingMetadata,
  isLoaded: isTrackingLoaded,
  totalFrames,
  loadMetadata,
  loadTracking
} = usePlayerTracking(tournamentId, matchId);

onMounted(async () => {
  await Promise.all([
    loadAll(),
    loadMetadata()
  ]);
});
</script>
```

---

## Testing y Validación

### Backend Testing

```bash
# 1. Deploy Firebase Functions
cd functions/
npm install
firebase deploy --only functions:processMatchData

# 2. Test con archivo de prueba
# Subir manualmente match-data.json a GCS
gsutil cp ingest/output/Veteranos2025_JenesanoVsTibana_2025-10-23T14-11-57.877Z.json \
  gs://gol360-scrape-raw-prod/raw/Veteranos2025/JenesanoVsTibana/match-data.json

# 3. Verificar logs
firebase functions:log --only processMatchData

# 4. Verificar Firestore
# Ir a Firebase Console > Firestore > tournaments/Veteranos2025/matches/JenesanoVsTibana
```

### Frontend Testing

```bash
# 1. Instalar dependencias
cd Gol-360-App/
npm install

# 2. Configurar variables de entorno (.env)
VITE_FIREBASE_PROJECT_ID=tu-project-id
# ... otras variables

# 3. Run dev server
npm run dev

# 4. Navegar a página de analytics
http://localhost:9000/tournaments/Veteranos2025/matches/JenesanoVsTibana/analytics
```

---

## Deployment

### Checklist de Deployment

- [ ] **Backend**
  - [ ] Modificar `scrape.js` para subir a GCS
  - [ ] Crear `processMatchData.js` function
  - [ ] Actualizar `firestore.rules`
  - [ ] Configurar CORS en Cloud Storage
  - [ ] Deploy functions: `firebase deploy --only functions`

- [ ] **Frontend**
  - [ ] Crear servicios (`matchAnalyticsService.ts`, `playerTrackingService.ts`)
  - [ ] Crear composables (`useMatchAnalytics.ts`, `usePlayerTracking.ts`)
  - [ ] Crear componentes (MatchStats.vue, etc.)
  - [ ] Agregar rutas en router
  - [ ] Build: `npm run build`
  - [ ] Deploy: `firebase deploy --only hosting`

- [ ] **Testing**
  - [ ] Ejecutar scraper completo
  - [ ] Verificar datos en Firestore
  - [ ] Verificar tracking URL en Firestore
  - [ ] Cargar página de analytics en frontend
  - [ ] Verificar descarga de tracking

---

## Próximos Pasos Recomendados

1. **Optimizaciones**
   - Implementar caché de tracking en IndexedDB
   - Comprimir tracking con gzip antes de subir
   - Implementar lazy loading de componentes

2. **Features Adicionales**
   - Heat map interactivo en canvas
   - Video overlay con tracking en tiempo real
   - Exportar análisis a PDF

3. **Monitoreo**
   - Agregar logging con Google Cloud Logging
   - Metrics de uso de tracking URLs
   - Alerts para URLs expiradas

---

## Resumen de Archivos a Crear/Modificar

### Backend
```
gol360-api/
├── ingest/src/scrape.js                    (MODIFICAR)
├── functions/processMatchData.js           (NUEVO)
├── functions/index.js                      (MODIFICAR - export)
├── api/firestore.rules                     (MODIFICAR)
└── storage-cors.json                       (NUEVO)
```

### Frontend
```
Gol-360-App/
├── src/services/
│   ├── matchAnalyticsService.ts           (NUEVO)
│   └── playerTrackingService.ts           (NUEVO)
├── src/composables/
│   ├── useMatchAnalytics.ts               (NUEVO)
│   └── usePlayerTracking.ts               (NUEVO)
├── src/components/match/
│   ├── MatchStats.vue                     (NUEVO)
│   ├── ShotMap.vue                        (NUEVO)
│   └── HeatMap.vue                        (NUEVO)
└── src/pages/
    └── MatchAnalyticsPage.vue             (NUEVO)
```

---

**¿Listo para empezar? Te recomiendo empezar por Fase 1 (Backend) para tener los datos fluyendo a Firestore primero.**
