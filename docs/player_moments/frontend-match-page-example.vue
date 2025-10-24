<!--
  Página de ejemplo completa para visualizar un match con tracking
  Path: Gol-360-App/src/pages/MatchDetailPage.vue
-->

<template>
  <q-page class="match-detail-page">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
      <div class="q-ml-md">Cargando datos del partido...</div>
    </div>

    <!-- Match content -->
    <div v-else-if="matchMetadata" class="q-pa-md">
      <!-- Header del match -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h4 text-center">
            {{ matchMetadata.HOME_TEAM }} vs {{ matchMetadata.AWAY_TEAM }}
          </div>
          <div class="text-subtitle2 text-center text-grey-7">
            {{ matchMetadata.TARGET_MATCH }}
          </div>
          <div class="row justify-center q-mt-sm q-gutter-md">
            <q-chip color="primary" text-color="white">
              Inicio del partido: {{ matchMetadata.MATCH_START }}
            </q-chip>
            <q-chip v-if="matchMetadata.VAR_TIME" color="orange" text-color="white">
              VAR Time: {{ matchMetadata.VAR_TIME }} min
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabs para diferentes secciones -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="video" label="Video + Tracking" />
        <q-tab name="stats" label="Estadísticas" />
        <q-tab name="players" label="Jugadores" />
        <q-tab name="highlights" label="Highlights" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- Tab: Video + Tracking -->
        <q-tab-panel name="video">
          <!-- Botón para cargar tracking si no está cargado -->
          <div v-if="!trackingData" class="text-center q-pa-md">
            <q-btn
              color="primary"
              label="Cargar Player Tracking"
              @click="loadTracking"
              :loading="loadingTracking"
              icon="download"
              size="lg"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                Descargando {{ trackingMetadata?.fileSizeMB }} MB...
              </template>
            </q-btn>
            <div class="text-caption text-grey-7 q-mt-sm">
              El archivo de tracking es de {{ trackingMetadata?.fileSizeMB }} MB
            </div>
          </div>

          <!-- Componente de video con tracking -->
          <video-player-with-tracking
            v-if="trackingData"
            :video-url="videoUrl"
            :tracking-data="trackingData"
            :player-moments="allPlayerMoments"
            :match-start="matchMetadata.MATCH_START"
          />
        </q-tab-panel>

        <!-- Tab: Stats -->
        <q-tab-panel name="stats">
          <div class="row q-col-gutter-md">
            <!-- Stats HOME -->
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section class="bg-primary text-white">
                  <div class="text-h6">{{ matchMetadata.HOME_TEAM }}</div>
                </q-card-section>
                <q-card-section>
                  <q-list v-if="homeStats">
                    <q-item v-for="stat in homeStats.data" :key="stat.name">
                      <q-item-section>
                        <q-item-label>{{ stat.name }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label class="text-bold">{{ stat.home }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <!-- Stats AWAY -->
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section class="bg-secondary text-white">
                  <div class="text-h6">{{ matchMetadata.AWAY_TEAM }}</div>
                </q-card-section>
                <q-card-section>
                  <q-list v-if="awayStats">
                    <q-item v-for="stat in awayStats.data" :key="stat.name">
                      <q-item-section>
                        <q-item-label>{{ stat.name }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label class="text-bold">{{ stat.away }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Shot Maps -->
          <div class="q-mt-md">
            <div class="text-h6 q-mb-md">Mapas de Tiros</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-card v-if="homeShotMaps">
                  <q-card-section>
                    <div class="text-subtitle1">{{ matchMetadata.HOME_TEAM }}</div>
                    <div v-for="shotMap in homeShotMaps.data" :key="shotMap.period" class="q-mt-md">
                      <div class="text-bold">{{ shotMap.period }}</div>
                      <img
                        v-if="shotMap.screenshot"
                        :src="shotMap.screenshot"
                        alt="Shot Map"
                        class="full-width"
                        style="max-height: 400px; object-fit: contain;"
                      />
                      <div class="text-caption q-mt-xs">
                        Goles: {{ shotMap.goals }} | Tiros: {{ shotMap.shots }} | {{ shotMap.conversionRate }}
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card v-if="awayShotMaps">
                  <q-card-section>
                    <div class="text-subtitle1">{{ matchMetadata.AWAY_TEAM }}</div>
                    <div v-for="shotMap in awayShotMaps.data" :key="shotMap.period" class="q-mt-md">
                      <div class="text-bold">{{ shotMap.period }}</div>
                      <img
                        v-if="shotMap.screenshot"
                        :src="shotMap.screenshot"
                        alt="Shot Map"
                        class="full-width"
                        style="max-height: 400px; object-fit: contain;"
                      />
                      <div class="text-caption q-mt-xs">
                        Goles: {{ shotMap.goals }} | Tiros: {{ shotMap.shots }} | {{ shotMap.conversionRate }}
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- Tab: Players -->
        <q-tab-panel name="players">
          <div class="row q-col-gutter-md">
            <!-- HOME Players -->
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section class="bg-primary text-white">
                  <div class="text-h6">{{ matchMetadata.HOME_TEAM }} - Jugadores</div>
                </q-card-section>
                <q-card-section>
                  <q-list>
                    <q-item
                      v-for="player in homePlayers"
                      :key="player.namePlayer"
                      clickable
                      @click="selectPlayer(player)"
                    >
                      <q-item-section avatar>
                        <q-avatar color="primary" text-color="white">
                          {{ player.jersey || '?' }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ player.namePlayer }}</q-item-label>
                        <q-item-label caption>
                          {{ player.momentsCount }} momentos
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-icon name="chevron_right" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <!-- AWAY Players -->
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section class="bg-secondary text-white">
                  <div class="text-h6">{{ matchMetadata.AWAY_TEAM }} - Jugadores</div>
                </q-card-section>
                <q-card-section>
                  <q-list>
                    <q-item
                      v-for="player in awayPlayers"
                      :key="player.namePlayer"
                      clickable
                      @click="selectPlayer(player)"
                    >
                      <q-item-section avatar>
                        <q-avatar color="secondary" text-color="white">
                          {{ player.jersey || '?' }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ player.namePlayer }}</q-item-label>
                        <q-item-label caption>
                          {{ player.momentsCount }} momentos
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-icon name="chevron_right" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>

        <!-- Tab: Highlights -->
        <q-tab-panel name="highlights">
          <div class="text-h6 q-mb-md">Highlights del Partido</div>
          <div class="row q-col-gutter-md">
            <div
              v-for="highlight in highlights"
              :key="highlight.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card>
                <q-card-section>
                  <div class="text-subtitle1">{{ highlight.title || 'Highlight' }}</div>
                  <div class="text-caption text-grey-7">
                    {{ highlight.side === 'home' ? matchMetadata.HOME_TEAM : matchMetadata.AWAY_TEAM }}
                  </div>
                  <!-- Aquí puedes agregar más detalles del highlight -->
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Dialog para mostrar detalles del jugador -->
    <q-dialog v-model="showPlayerDialog">
      <q-card style="min-width: 400px">
        <q-card-section v-if="selectedPlayerDetail">
          <div class="text-h6">{{ selectedPlayerDetail.namePlayer }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ selectedPlayerDetail.team }} ({{ selectedPlayerDetail.side }})
          </div>
        </q-card-section>

        <q-card-section v-if="selectedPlayerDetail">
          <div class="text-bold q-mb-sm">Momentos ({{ selectedPlayerDetail.momentsCount }}):</div>
          <q-list dense>
            <q-item v-for="(moment, idx) in selectedPlayerDetail.moments" :key="idx">
              <q-item-section>
                <q-item-label>⏱️ {{ moment.startTime }}</q-item-label>
                <q-item-label caption>
                  Duración: {{ moment.duration }} | Frames: {{ moment.trackingStart }} - {{ moment.trackingEnd }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { MatchDataService } from 'src/services/matchDataService';
import VideoPlayerWithTracking from 'src/components/VideoPlayerWithTracking.vue';
import { useQuasar } from 'quasar';

// Quasar
const $q = useQuasar();

// Service
const tournamentId = 'T97S5C';
const matchId = 'HY98HDY-T97S5C';
const matchService = new MatchDataService(tournamentId, matchId);

// State
const loading = ref(true);
const loadingTracking = ref(false);
const activeTab = ref('video');

const matchMetadata = ref(null);
const homeStats = ref(null);
const awayStats = ref(null);
const homeShotMaps = ref(null);
const awayShotMaps = ref(null);
const homePlayers = ref([]);
const awayPlayers = ref([]);
const highlights = ref([]);
const trackingData = ref(null);
const trackingMetadata = ref(null);

const showPlayerDialog = ref(false);
const selectedPlayerDetail = ref(null);

// Computed
const allPlayerMoments = computed(() => {
  return [...homePlayers.value, ...awayPlayers.value];
});

// IMPORTANTE: Reemplaza esto con la URL real de tu video de Veo
const videoUrl = ref('https://your-video-url.com/match.mp4');

// Methods
async function loadMatchData() {
  try {
    loading.value = true;

    // Cargar en paralelo todos los datos (excepto tracking que es grande)
    const [metadata, statsHome, statsAway, shotMapHome, shotMapAway, playersHome, playersAway, highlightsData, trackingMeta] = await Promise.all([
      matchService.getMatchMetadata(),
      matchService.getTeamStats('home'),
      matchService.getTeamStats('away'),
      matchService.getShotMaps('home'),
      matchService.getShotMaps('away'),
      matchService.getPlayerMoments('home'),
      matchService.getPlayerMoments('away'),
      matchService.getHighlights(),
      matchService.getTrackingMetadata()
    ]);

    matchMetadata.value = metadata;
    homeStats.value = statsHome;
    awayStats.value = statsAway;
    homeShotMaps.value = shotMapHome;
    awayShotMaps.value = shotMapAway;
    homePlayers.value = playersHome;
    awayPlayers.value = playersAway;
    highlights.value = highlightsData;
    trackingMetadata.value = trackingMeta;

    $q.notify({
      type: 'positive',
      message: 'Datos del partido cargados correctamente',
      position: 'top'
    });

  } catch (error) {
    console.error('Error loading match data:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al cargar los datos del partido',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
}

async function loadTracking() {
  try {
    loadingTracking.value = true;

    $q.notify({
      type: 'info',
      message: `Descargando ${trackingMetadata.value.fileSizeMB} MB de tracking...`,
      position: 'top',
      timeout: 2000
    });

    trackingData.value = await matchService.downloadPlayerTracking();

    $q.notify({
      type: 'positive',
      message: 'Player tracking cargado correctamente',
      position: 'top'
    });

  } catch (error) {
    console.error('Error loading tracking:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el player tracking',
      position: 'top'
    });
  } finally {
    loadingTracking.value = false;
  }
}

function selectPlayer(player) {
  selectedPlayerDetail.value = player;
  showPlayerDialog.value = true;
}

// Lifecycle
onMounted(() => {
  loadMatchData();
});
</script>

<style scoped lang="scss">
.match-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
