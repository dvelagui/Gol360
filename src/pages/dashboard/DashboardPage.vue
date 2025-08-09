<template>
  <q-page class="dashboard q-pa-lg">
    <div class="row items-start q-col-gutter-lg">
      <!-- Top actions -->
      <div class="col-12">
        <div class="row items-center justify-between q-gutter-sm">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="40px" class="bg-brand-600 text-white">
              <q-icon name="sports_soccer" />
            </q-avatar>
            <div>
              <div class="text-h6 text-brand-900">Hola, {{ displayName }}</div>
              <div class="text-caption text-secondary">Bienvenido a tu panel</div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-select v-model="selectedTournament" :options="tournamentOptions" label="Torneo" dense outlined class="w-200" />
            <q-input v-model="search" dense outlined placeholder="Buscar equipos, jugadores, videos" debounce="300" clearable>
              <template #append><q-icon name="search" /></template>
            </q-input>
            <q-btn color="brand" unelevated icon="add" label="Nuevo partido" @click="createMatch" />
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="col-12">
        <div class="row q-col-gutter-lg">
          <div v-for="k in kpis" :key="k.key" class="col-12 col-sm-6 col-md-3">
            <q-card class="kpi-card">
              <q-card-section class="row items-center justify-between">
                <div>
                  <div class="text-subtitle2 text-secondary">{{ k.label }}</div>
                  <div class="text-h4 text-brand-900 q-mt-xs">{{ k.value }}</div>
                </div>
                <q-avatar size="40px" class="bg-brand-50">
                  <q-icon :name="k.icon" class="text-brand-600" />
                </q-avatar>
              </q-card-section>
              <q-linear-progress v-if="k.progress != null" :value="k.progress" color="brand" track-color="brand-50" class="q-mx-md q-mb-md" />
            </q-card>
          </div>
        </div>
      </div>

      <!-- Próximo partido -->
      <div class="col-12 col-md-7">
        <q-card class="next-match">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-subtitle1 text-secondary">Próximo partido</div>
              <q-chip square color="warning" text-color="white" icon="schedule">{{ nextMatch.timeUntil }}</q-chip>
            </div>

            <div class="row items-center q-gutter-lg q-mt-md">
              <q-avatar size="56px"><img :src="nextMatch.home.logo" /></q-avatar>
              <div class="text-h6">{{ nextMatch.home.name }}</div>
              <div class="text-h5 text-secondary">vs</div>
              <q-avatar size="56px"><img :src="nextMatch.away.logo" /></q-avatar>
              <div class="text-h6">{{ nextMatch.away.name }}</div>
            </div>

            <div class="text-caption q-mt-sm">{{ nextMatch.date }} · {{ nextMatch.venue }}</div>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat icon="bolt" label="Configurar streaming" />
            <q-btn flat icon="share" label="Compartir link" />
            <q-btn color="brand" icon="play_circle" label="Ir a partido" unelevated />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Analítica rápida -->
      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1 text-secondary">Analítica rápida</div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-6">
                <div class="text-caption">Posesión promedio</div>
                <q-circular-progress :value="62" show-value color="brand" center-color="brand-50" class="q-mt-sm" />
              </div>
              <div class="col-6">
                <div class="text-caption">Goles/partido</div>
                <div class="text-h4 text-brand-900 q-mt-sm">2.4</div>
              </div>
              <div class="col-12">
                <q-linear-progress :value="0.78" color="positive" track-color="grey-3" class="q-mt-md" />
                <div class="text-caption q-mt-xs">Precisión de pases (últimos 5 juegos)</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Últimos videos -->
      <div class="col-12">
        <q-card>
          <q-card-section class="row items-center justify-between">
            <div class="text-subtitle1 text-secondary">Últimos videos subidos</div>
            <q-btn flat icon="video_library" label="Ver todos" to="/videos" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-lg">
              <div v-for="v in recentVideos" :key="v.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
                <q-card class="hoverable video-card">
                  <q-img :src="v.thumbnail" :ratio="16/9">
                    <div class="absolute-bottom text-white q-pa-sm bg-transparent">{{ v.title }}</div>
                    <q-badge floating color="brand">{{ v.duration }}</q-badge>
                  </q-img>
                  <q-card-section class="row items-center justify-between">
                    <q-chip dense icon="insights">{{ v.metrics.views }} vistas</q-chip>
                    <q-btn round dense icon="play_arrow" color="brand" :to="`/videos/${v.id}`" />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <q-fab position="bottom-right" color="brand" icon="add" direction="up">
      <q-fab-action icon="sports" label="Nuevo partido" />
      <q-fab-action icon="videocam" label="Nuevo video" />
      <q-fab-action icon="group" label="Nuevo equipo" />
    </q-fab>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const displayName = 'Daniel' // <- traer de tu store user
const search = ref('')
const selectedTournament = ref(null)
const tournamentOptions = ref([{ label: 'Liga Norte 2025', value: 'ln2025' }])

const kpis = ref([
  { key: 'matchesWeek', label: 'Partidos esta semana', value: 8, icon: 'event' },
  { key: 'videosPending', label: 'Videos por revisar', value: 12, icon: 'videocam' },
  { key: 'avgViews', label: 'Vistas (7 días)', value: '4.3k', icon: 'bar_chart' },
  { key: 'storage', label: 'Almacenamiento', value: '78%', icon: 'cloud_upload', progress: 0.78 }
])

const nextMatch = ref({
  timeUntil: 'En 2h 15m',
  date: 'Sáb, 10 Ago · 3:00 PM',
  venue: 'Cancha La Fragua',
  home: { name: 'Leones FC', logo: '/assets/teams/leones.png' },
  away: { name: 'Águilas', logo: '/assets/teams/aguilas.png' }
})

const recentVideos = ref([
  { id: 'abc1', title: 'Jornada 5 · Leones vs Águilas', duration: '90:00', thumbnail: '/assets/thumbs/m1.jpg', metrics: { views: 920 } },
  { id: 'abc2', title: 'Jornada 5 · Tigres vs Pumas', duration: '90:00', thumbnail: '/assets/thumbs/m2.jpg', metrics: { views: 610 } },
  { id: 'abc3', title: 'Jornada 4 · Halcones vs Jaguares', duration: '90:00', thumbnail: '/assets/thumbs/m3.jpg', metrics: { views: 402 } },
  { id: 'abc4', title: 'Resumen Jornada 4', duration: '03:20', thumbnail: '/assets/thumbs/m4.jpg', metrics: { views: 1280 } }
])

function createMatch () {
  // TODO: router.push('/matches/create') o abrir dialog
}
</script>

<style scoped>
.dashboard {
  --brand-900: #064F34; /* verde oscuro */
  --brand-600: #138A59; /* verde */
  --brand-50:  #E6F4EE; /* verde muy claro */
}
.text-brand-900 { color: var(--brand-900); }
.text-secondary { color: #6B7280; }
.text-brand-600 { color: var(--brand-600); }
.bg-brand-50 { background: var(--brand-50); }
.kpi-card { border: 1px solid #eef2f2; }
.next-match .q-card__section:first-child {
  background: linear-gradient(90deg, rgba(6,79,52,.06), rgba(19,138,89,.04));
  border-bottom: 1px solid #eef2f2;
}
.video-card { transition: transform .15s ease; }
.video-card:hover { transform: translateY(-2px); }
.q-fab { box-shadow: 0 10px 30px rgba(6,79,52,.25); }
.w-200 { width: 200px; }
</style>
