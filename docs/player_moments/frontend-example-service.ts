/**
 * Servicio de ejemplo para consumir datos del match desde Firestore
 * Este archivo va en: Gol-360-App/src/services/matchDataService.ts
 */

import { db } from 'src/boot/firebase'; // Tu configuración de Firebase
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

export interface MatchMetadata {
  HOME_TEAM: string;
  AWAY_TEAM: string;
  TOURNAMENT_ID: string;
  MATCH_ID: string;
  TARGET_MATCH: string;
  MATCH_START: string; // Formato "MM:SS"
  VAR_TIME: number;
  scrapedDataAvailable: boolean;
  lastScraped: Date;
}

export interface PlayerMoment {
  startTime: string; // "00:54"
  duration: string; // "14s"
  trackingStart: number; // Frame inicial en el tracking
  trackingEnd: number; // Frame final en el tracking
}

export interface PlayerMomentsData {
  side: 'home' | 'away';
  team: string;
  namePlayer: string;
  moments: PlayerMoment[];
  momentsCount: number;
}

export interface TrackingFrame {
  [playerId: string]: {
    x: number;
    y: number;
    jersey?: string;
    team?: string;
  };
}

export interface PlayerTrackingData {
  [timestamp: number]: TrackingFrame;
}

export interface TrackingMetadata {
  gcsPath: string;
  signedUrl: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  urlExpiresAt: Date;
}

/**
 * Servicio para manejar datos de matches
 */
export class MatchDataService {
  private tournamentId: string;
  private matchId: string;

  constructor(tournamentId: string, matchId: string) {
    this.tournamentId = tournamentId;
    this.matchId = matchId;
  }

  /**
   * 1. Obtener metadata del match
   */
  async getMatchMetadata(): Promise<MatchMetadata | null> {
    try {
      const matchRef = doc(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId
      );
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
        console.error('Match not found');
        return null;
      }

      return matchDoc.data() as MatchMetadata;
    } catch (error) {
      console.error('Error fetching match metadata:', error);
      throw error;
    }
  }

  /**
   * 2. Obtener stats de un equipo
   */
  async getTeamStats(side: 'home' | 'away') {
    try {
      const statsRef = doc(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId,
        'stats',
        side
      );
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) return null;

      return statsDoc.data();
    } catch (error) {
      console.error(`Error fetching ${side} stats:`, error);
      throw error;
    }
  }

  /**
   * 3. Obtener shot maps de un equipo
   */
  async getShotMaps(side: 'home' | 'away') {
    try {
      const shotMapRef = doc(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId,
        'shotMaps',
        side
      );
      const shotMapDoc = await getDoc(shotMapRef);

      if (!shotMapDoc.exists()) return null;

      return shotMapDoc.data();
    } catch (error) {
      console.error(`Error fetching ${side} shot maps:`, error);
      throw error;
    }
  }

  /**
   * 4. Obtener player moments de un equipo
   */
  async getPlayerMoments(side: 'home' | 'away'): Promise<PlayerMomentsData[]> {
    try {
      const playerMomentsRef = collection(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId,
        'playerMoments'
      );

      // Query para obtener solo jugadores del lado especificado
      const q = query(playerMomentsRef, where('side', '==', side));
      const snapshot = await getDocs(q);

      const players: PlayerMomentsData[] = [];
      snapshot.forEach((doc) => {
        players.push(doc.data() as PlayerMomentsData);
      });

      return players;
    } catch (error) {
      console.error(`Error fetching ${side} player moments:`, error);
      throw error;
    }
  }

  /**
   * 5. Obtener player moments de un jugador específico
   */
  async getPlayerMomentsByName(
    side: 'home' | 'away',
    playerName: string
  ): Promise<PlayerMomentsData | null> {
    try {
      const docId = `${side}_${playerName}`.replace(/[^\w-]/g, '_');
      const playerRef = doc(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId,
        'playerMoments',
        docId
      );

      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) return null;

      return playerDoc.data() as PlayerMomentsData;
    } catch (error) {
      console.error(`Error fetching player ${playerName}:`, error);
      throw error;
    }
  }

  /**
   * 6. Obtener metadata del player tracking
   */
  async getTrackingMetadata(): Promise<TrackingMetadata | null> {
    try {
      const trackingRef = doc(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId,
        'tracking',
        'metadata'
      );

      const trackingDoc = await getDoc(trackingRef);

      if (!trackingDoc.exists()) return null;

      return trackingDoc.data() as TrackingMetadata;
    } catch (error) {
      console.error('Error fetching tracking metadata:', error);
      throw error;
    }
  }

  /**
   * 7. Descargar el archivo completo de player tracking (4.99 MB)
   * IMPORTANTE: Este archivo es grande, descárgalo solo una vez y cachéalo
   */
  async downloadPlayerTracking(): Promise<PlayerTrackingData | null> {
    try {
      // Primero obtenemos la URL firmada
      const metadata = await this.getTrackingMetadata();

      if (!metadata || !metadata.signedUrl) {
        console.error('No tracking URL available');
        return null;
      }

      // Verificar si la URL no ha expirado
      if (new Date() > metadata.urlExpiresAt) {
        console.error('Tracking URL has expired');
        // Aquí deberías tener lógica para regenerar la URL firmada
        return null;
      }

      console.log(`Downloading player tracking (${metadata.fileSizeMB} MB)...`);

      // Descargar el JSON desde la URL firmada
      const response = await fetch(metadata.signedUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const trackingData: PlayerTrackingData = await response.json();

      console.log(
        `✅ Player tracking downloaded: ${Object.keys(trackingData).length} frames`
      );

      return trackingData;
    } catch (error) {
      console.error('Error downloading player tracking:', error);
      throw error;
    }
  }

  /**
   * 8. Obtener highlights
   */
  async getHighlights(side?: 'home' | 'away') {
    try {
      const highlightsRef = collection(
        db,
        'tournaments',
        this.tournamentId,
        'matches',
        this.matchId,
        'highlights'
      );

      let q = highlightsRef;

      // Filtrar por lado si se especifica
      if (side) {
        q = query(highlightsRef, where('side', '==', side));
      }

      const snapshot = await getDocs(q);
      const highlights: any[] = [];

      snapshot.forEach((doc) => {
        highlights.push({ id: doc.id, ...doc.data() });
      });

      return highlights;
    } catch (error) {
      console.error('Error fetching highlights:', error);
      throw error;
    }
  }
}

/**
 * EJEMPLO DE USO EN UN COMPONENTE VUE
 */
export const exampleUsage = `
// En tu componente Vue (ej: MatchDetailPage.vue)

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { MatchDataService } from 'src/services/matchDataService';

const tournamentId = 'T97S5C';
const matchId = 'HY98HDY-T97S5C';

const matchService = new MatchDataService(tournamentId, matchId);

const matchMetadata = ref(null);
const homeStats = ref(null);
const awayStats = ref(null);
const homePlayers = ref([]);
const awayPlayers = ref([]);
const trackingData = ref(null);
const trackingMetadata = ref(null);

onMounted(async () => {
  try {
    // 1. Cargar metadata del match
    matchMetadata.value = await matchService.getMatchMetadata();
    console.log('Match:', matchMetadata.value);

    // 2. Cargar stats de ambos equipos
    homeStats.value = await matchService.getTeamStats('home');
    awayStats.value = await matchService.getTeamStats('away');

    // 3. Cargar jugadores con sus momentos
    homePlayers.value = await matchService.getPlayerMoments('home');
    awayPlayers.value = await matchService.getPlayerMoments('away');

    console.log('Home players:', homePlayers.value.length);
    console.log('Away players:', awayPlayers.value.length);

    // 4. Cargar metadata del tracking (para mostrar info al usuario)
    trackingMetadata.value = await matchService.getTrackingMetadata();
    console.log('Tracking file size:', trackingMetadata.value.fileSizeMB, 'MB');

    // 5. IMPORTANTE: Solo descargar tracking cuando el usuario lo necesite
    // No descargues automáticamente porque son 5MB
    // trackingData.value = await matchService.downloadPlayerTracking();

  } catch (error) {
    console.error('Error loading match data:', error);
  }
});

// Función para cargar tracking cuando sea necesario (ej: cuando el usuario haga clic en "Ver tracking")
const loadTracking = async () => {
  if (!trackingData.value) {
    trackingData.value = await matchService.downloadPlayerTracking();
    console.log('Tracking frames:', Object.keys(trackingData.value).length);
  }
};

</script>

<template>
  <q-page>
    <div v-if="matchMetadata">
      <h2>{{ matchMetadata.HOME_TEAM }} vs {{ matchMetadata.AWAY_TEAM }}</h2>
      <p>Match Start: {{ matchMetadata.MATCH_START }}</p>
      <p>VAR Time: {{ matchMetadata.VAR_TIME }}</p>
    </div>

    <q-btn @click="loadTracking">Cargar Player Tracking</q-btn>

    <div v-if="trackingData">
      <!-- Aquí renderizas el video con el tracking overlay -->
      <video-player-with-tracking :tracking-data="trackingData" />
    </div>
  </q-page>
</template>
`;
