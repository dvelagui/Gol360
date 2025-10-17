<template>
  <q-page class="player-dashboard">
    <div class="dashboard-hero">
      <div class="hero-content">
        <div class="welcome-section">
          <h4 class="welcome-title">¡Hola, {{ playerName }}!</h4>
          <p class="welcome-subtitle">Bienvenido a tu panel de jugador</p>
        </div>
        <q-avatar size="64px" class="player-avatar">
          <img v-if="userPhotoURL" :src="userPhotoURL" />
          <q-icon v-else name="person" size="32px" />
        </q-avatar>
      </div>
    </div>
    <div class="main-actions-section">
      <div class="main-actions-grid">
        <q-card class="main-action-card" @click="goToCompetition">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper camerino">
              <q-icon name="door_front" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">El Camerino</div>
              <div class="action-subtitle">Competición</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="main-action-card" @click="goToSchedule">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper jornada">
              <q-icon name="today" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">La Jornada</div>
              <div class="action-subtitle">Calendario</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="main-action-card" @click="goToStats">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper pizarra">
              <q-icon name="analytics" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">La Pizarra</div>
              <div class="action-subtitle">Estadísticas</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="stats-section">
      <h5 class="section-title">
        <q-icon name="bar_chart" size="24px" />
        Estadísticas Rápidas
      </h5>
      <div class="stats-grid">
        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="sports_soccer" size="32px" color="positive" />
            <div class="stat-info">
              <div class="stat-value">{{ quickStats.goals }}</div>
              <div class="stat-label">Goles</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="timer" size="32px" color="primary" />
            <div class="stat-info">
              <div class="stat-value">{{ quickStats.minutesPlayed }}'</div>
              <div class="stat-label">Minutos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="emoji_events" size="32px" color="warning" />
            <div class="stat-info">
              <div class="stat-value">{{ quickStats.matches }}</div>
              <div class="stat-label">Partidos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="movie" size="32px" color="info" />
            <div class="stat-info">
              <div class="stat-value">{{ quickStats.clips }}</div>
              <div class="stat-label">Clips</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="tournaments-section">
      <div class="section-header">
        <h5 class="section-title">
          <q-icon name="emoji_events" size="24px" />
          Mis Torneos
        </h5>
        <q-btn
          flat
          dense
          color="primary"
          icon="open_in_new"
          label="Ver todos"
          size="sm"
          @click="goToTournaments"
        />
      </div>

      <div v-if="myTournaments.length === 0" class="empty-state">
        <q-icon name="emoji_events" size="64px" color="grey-4" />
        <p class="text-grey-6">No estás registrado en ningún torneo aún</p>
      </div>

      <div v-else class="tournaments-list">
        <q-card
          v-for="tournament in myTournaments"
          :key="tournament.id"
          class="tournament-card"
          @click="goToTournament(tournament.id)"
        >
          <q-card-section class="tournament-content">
            <div class="tournament-icon">
              <q-icon name="emoji_events" size="32px" color="primary" />
            </div>
            <div class="tournament-info">
              <div class="tournament-name">{{ tournament.name }}</div>
              <div class="tournament-meta">
                <q-chip size="sm" color="grey-3" text-color="grey-8">
                  <q-icon name="groups" size="16px" class="q-mr-xs" />
                  {{ tournament.teamName }}
                </q-chip>
                <q-chip size="sm" :color="tournament.statusColor" text-color="white">
                  {{ tournament.status }}
                </q-chip>
              </div>
            </div>
            <q-icon name="chevron_right" size="24px" color="grey-6" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="matches-section">
      <div class="section-header">
        <h5 class="section-title">
          <q-icon name="schedule" size="24px" />
          Próximos Partidos
        </h5>
        <q-btn
          flat
          dense
          color="primary"
          icon="calendar_month"
          label="Calendario"
          size="sm"
          @click="goToSchedule"
        />
      </div>

      <div v-if="upcomingMatches.length === 0" class="empty-state">
        <q-icon name="schedule" size="64px" color="grey-4" />
        <p class="text-grey-6">No hay próximos partidos programados</p>
      </div>

      <div v-else class="matches-list">
        <q-card
          v-for="match in upcomingMatches"
          :key="match.id"
          class="match-card upcoming-match-card"
        >
          <q-card-section class="match-content">
            <div class="match-date-time">
              <div class="match-date">
                <q-icon name="calendar_today" size="16px" />
                <span>{{ match.date }}</span>
              </div>
              <div class="match-time">
                <q-icon name="schedule" size="16px" />
                <span>{{ match.time }}</span>
              </div>
            </div>
            <div class="match-teams">
              <div class="team home-team" :class="{ 'team-highlight': match.myTeam === 'home' }">
                <span class="team-name">{{ match.homeTeam }}</span>
              </div>
              <div class="match-vs">VS</div>
              <div class="team away-team" :class="{ 'team-highlight': match.myTeam === 'away' }">
                <span class="team-name">{{ match.awayTeam }}</span>
              </div>
            </div>
            <q-chip
              v-if="match.field"
              size="sm"
              color="grey-3"
              text-color="grey-8"
              icon="stadium"
              class="field-chip"
            >
              {{ match.field }}
            </q-chip>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="matches-section">
      <div class="section-header">
        <h5 class="section-title">
          <q-icon name="sports_soccer" size="24px" />
          Partidos Recientes
        </h5>
        <q-btn
          flat
          dense
          color="primary"
          icon="history"
          label="Ver todos"
          size="sm"
          @click="goToSchedule"
        />
      </div>

      <div v-if="recentMatches.length === 0" class="empty-state">
        <q-icon name="sports_soccer" size="64px" color="grey-4" />
        <p class="text-grey-6">No hay partidos recientes</p>
      </div>

      <div v-else class="matches-list">
        <q-card
          v-for="match in recentMatches"
          :key="match.id"
          class="match-card"
          @click="goToMatchStats"
        >
          <q-card-section class="match-content">
            <div class="match-date">
              <q-icon name="calendar_today" size="16px" />
              <span>{{ match.date }}</span>
            </div>
            <div class="match-teams">
              <div class="team home-team" :class="{ 'team-highlight': match.myTeam === 'home' }">
                <span class="team-name">{{ match.homeTeam }}</span>
                <span class="team-score">{{ match.homeScore }}</span>
              </div>
              <div class="match-vs">VS</div>
              <div class="team away-team" :class="{ 'team-highlight': match.myTeam === 'away' }">
                <span class="team-score">{{ match.awayScore }}</span>
                <span class="team-name">{{ match.awayTeam }}</span>
              </div>
            </div>
            <q-badge
              v-if="match.hasVideo"
              color="primary"
              class="video-badge"
            >
              <q-icon name="play_circle" size="14px" class="q-mr-xs" />
              Video disponible
            </q-badge>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'

const router = useRouter()
const userStore = useUserStore()
const databaseStore = useDatabaseStore()

// User data
const playerName = computed(() => {
  return databaseStore.userData?.displayName || userStore.user?.displayName || 'Jugador'
})

const userPhotoURL = computed(() => {
  return databaseStore.userData?.photoURL || userStore.user?.photoURL || null
})

// Mock data - Replace with real data from Firestore/API
const quickStats = ref({
  goals: 8,
  minutesPlayed: 450,
  matches: 12,
  clips: 24
})

const myTournaments = ref([
  {
    id: 't1',
    name: 'Copa Veteranos Tunja 2025',
    teamName: 'Colo Colo',
    status: 'En curso',
    statusColor: 'positive'
  },
  {
    id: 't2',
    name: 'Liga Local Primavera',
    teamName: 'Tigres FC',
    status: 'Finalizado',
    statusColor: 'grey-6'
  }
])

const upcomingMatches = ref([
  {
    id: 'um1',
    date: '22 Oct 2025',
    time: '15:00',
    homeTeam: 'Colo Colo',
    awayTeam: 'Tigres FC',
    myTeam: 'home',
    field: 'Cancha Principal'
  },
  {
    id: 'um2',
    date: '25 Oct 2025',
    time: '18:30',
    homeTeam: 'Real Central',
    awayTeam: 'Colo Colo',
    myTeam: 'away',
    field: 'Estadio Norte'
  }
])

const recentMatches = ref([
  {
    id: 'm1',
    date: '15 Oct 2025',
    homeTeam: 'Colo Colo',
    awayTeam: 'Ind. Valle',
    homeScore: 3,
    awayScore: 2,
    myTeam: 'home',
    hasVideo: true
  },
  {
    id: 'm2',
    date: '10 Oct 2025',
    homeTeam: 'Atlético Norte',
    awayTeam: 'Colo Colo',
    homeScore: 1,
    awayScore: 1,
    myTeam: 'away',
    hasVideo: true
  },
  {
    id: 'm3',
    date: '05 Oct 2025',
    homeTeam: 'Colo Colo',
    awayTeam: 'Real Central',
    homeScore: 2,
    awayScore: 0,
    myTeam: 'home',
    hasVideo: false
  }
])

// Navigation functions
function goToCompetition() {
  void router.push('/player/tournaments/competition')
}

function goToSchedule() {
  void router.push('/player/tournaments/schedule')
}

function goToStats() {
  void router.push('/player/tournaments/stats')
}

function goToTournaments() {
  void router.push('/player/tournaments')
}

function goToTournament(id: string) {
  void router.push(`/player/tournaments/${id}`)
}

function goToMatchStats() {
  void router.push('/player/tournaments/stats')
}

// Load data on mount
onMounted(() => {
  // TODO: Fetch real data from Firestore
  // - Player stats from tournaments
  // - Recent matches
  // - Tournaments where player is registered
  console.log('PlayerDashboard mounted - Load real data here')
})
</script>

<style scoped lang="scss">
.player-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

// Hero Section
.dashboard-hero {
  background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
  padding: 32px 16px;
  margin: -16px -16px 24px -16px;
  color: white;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  flex: 1;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
}

.welcome-subtitle {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

.player-avatar {
  border: 3px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

// Section Headers
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #064F34;
  margin: 0 0 16px 0;
  padding-left: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

// Main Navigation Actions
.main-actions-section {
  padding: 0 16px;
  margin-bottom: 32px;
}

.main-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.main-action-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #064F34 0%, #138A59 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(6, 79, 52, 0.2);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

.main-action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 12px !important;
  text-align: center;
}

.action-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;

  &.camerino {
    background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
  }

  &.jornada {
    background: linear-gradient(135deg, #FF6B35 0%, #E85D2F 100%);
  }

  &.pizarra {
    background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
  }
}

.main-action-card:hover .action-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

.action-text {
  width: 100%;
}

.action-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #064F34;
  margin-bottom: 2px;
  line-height: 1.2;
}

.action-subtitle {
  font-size: 0.7rem;
  color: #666;
  font-weight: 500;
}

// Stats Section
.stats-section {
  padding: 0 16px;
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px !important;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #064F34;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 4px;
}

// Tournaments Section
.tournaments-section {
  padding: 0 16px;
  margin-bottom: 32px;
}

.tournaments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tournament-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateX(4px);
  }
}

.tournament-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px !important;
}

.tournament-icon {
  flex-shrink: 0;
}

.tournament-info {
  flex: 1;
  min-width: 0;
}

.tournament-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.tournament-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// Matches Section
.matches-section {
  padding: 0 16px;
  margin-bottom: 32px;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateX(4px);
  }
}

.match-content {
  padding: 16px !important;
}

.upcoming-match-card {
  border-left: 4px solid #064F34;
}

.match-date-time {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.match-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
}

.match-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #064F34;
  font-weight: 600;
}

.field-chip {
  margin-top: 8px;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.team {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;

  &.home-team {
    align-items: flex-start;
  }

  &.away-team {
    align-items: flex-end;
  }

  &.team-highlight {
    .team-name {
      font-weight: 700;
      color: #064F34;
    }
  }
}

.team-name {
  font-size: 0.95rem;
  color: #333;
}

.team-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #064F34;
}

.match-vs {
  font-size: 0.75rem;
  font-weight: 600;
  color: #999;
  padding: 0 8px;
}

.video-badge {
  margin-top: 8px;
}
// Empty States
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  gap: 16px;
}

// Responsive
@media (min-width: 768px) {
  .main-actions-grid {
    gap: 16px;
  }

  .main-action-content {
    padding: 24px 16px !important;
  }

  .action-icon-wrapper {
    width: 72px;
    height: 72px;
  }

  .action-title {
    font-size: 1rem;
  }

  .action-subtitle {
    font-size: 0.8rem;
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .dashboard-hero {
    padding: 48px 32px;
    margin: -16px -16px 32px -16px;
  }

  .welcome-title {
    font-size: 2.25rem;
  }

  .welcome-subtitle {
    font-size: 1.1rem;
  }
}

@media (max-width: 599px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .match-teams {
    gap: 8px;
  }

  .team-name {
    font-size: 0.85rem;
  }

  .team-score {
    font-size: 1.25rem;
  }
}
</style>
