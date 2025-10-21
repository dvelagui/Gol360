<template>
  <q-page class="manager-dashboard">
    <!-- Hero Header -->
    <div class="dashboard-hero">
      <div class="hero-content">
        <div class="welcome-section">
          <h4 class="welcome-title">Panel del Organizador</h4>
          <p class="welcome-subtitle">Gestiona tus torneos, equipos y calendario</p>
        </div>
        <q-avatar size="64px" class="manager-avatar">
          <img v-if="userPhotoURL" :src="userPhotoURL" />
          <q-icon v-else name="person" size="32px" />
        </q-avatar>
      </div>
    </div>

    <!-- Main Navigation Actions -->
    <div class="main-actions-section">
      <div class="main-actions-grid">
        <q-card class="main-action-card" @click="goToTournaments">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper tournaments">
              <q-icon name="emoji_events" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">Torneos</div>
              <div class="action-subtitle">Gestionar</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="main-action-card" @click="goToSchedule">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper schedule">
              <q-icon name="calendar_month" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">Calendario</div>
              <div class="action-subtitle">Programar</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="main-action-card" @click="goToTeams">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper teams">
              <q-icon name="groups" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">Equipos</div>
              <div class="action-subtitle">Administrar</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="stats-section">
      <h5 class="section-title">
        <q-icon name="dashboard" size="24px" />
        Resumen General
      </h5>
      <div class="stats-grid">
        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="emoji_events" size="32px" color="primary" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeTournaments }}</div>
              <div class="stat-label">Torneos Activos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="groups" size="32px" color="info" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalTeams }}</div>
              <div class="stat-label">Equipos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="sports_soccer" size="32px" color="warning" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalMatches }}</div>
              <div class="stat-label">Partidos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="people" size="32px" color="positive" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPlayers }}</div>
              <div class="stat-label">Jugadores</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- My Tournaments -->
    <div class="tournaments-section">
      <div class="section-header">
        <h5 class="section-title">
          <q-icon name="emoji_events" size="24px" />
          Mis Torneos
        </h5>
        <q-btn
          outline
          color="primary"
          icon="add"
          label="Nuevo Torneo"
          size="sm"
          @click="createTournament"
        />
      </div>

      <div v-if="myTournaments.length === 0" class="empty-state">
        <q-icon name="emoji_events" size="64px" color="grey-4" />
        <p class="text-grey-6">No has creado ningún torneo aún</p>
        <q-btn color="primary" icon="add" label="Crear Torneo" @click="createTournament" />
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
                  {{ tournament.teams }} equipos
                </q-chip>
                <q-chip size="sm" color="grey-3" text-color="grey-8">
                  <q-icon name="sports_soccer" size="16px" class="q-mr-xs" />
                  {{ tournament.matches }} partidos
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

    <!-- Upcoming Matches -->
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
          icon="add"
          label="Programar"
          size="sm"
          @click="scheduleMatch"
        />
      </div>

      <div v-if="upcomingMatches.length === 0" class="empty-state">
        <q-icon name="schedule" size="64px" color="grey-4" />
        <p class="text-grey-6">No hay partidos programados</p>
      </div>

      <div v-else class="matches-list">
        <q-card
          v-for="match in upcomingMatches"
          :key="match.id"
          class="match-card upcoming-match-card"
        >
          <q-card-section class="match-content">
            <div class="match-header">
              <div class="match-tournament">
                <q-icon name="emoji_events" size="14px" />
                <span>{{ match.tournament }}</span>
              </div>
              <div class="match-date-time">
                <q-icon name="calendar_today" size="14px" />
                <span>{{ match.date }} - {{ match.time }}</span>
              </div>
            </div>
            <div class="match-teams">
              <div class="team home-team">
                <span class="team-name">{{ match.homeTeam }}</span>
              </div>
              <div class="match-vs">VS</div>
              <div class="team away-team">
                <span class="team-name">{{ match.awayTeam }}</span>
              </div>
            </div>
            <div class="match-actions">
              <q-chip
                v-if="match.field"
                size="sm"
                color="grey-3"
                text-color="grey-8"
                icon="stadium"
              >
                {{ match.field }}
              </q-chip>
              <q-btn
                flat
                dense
                color="primary"
                icon="edit"
                size="sm"
                @click.stop="editMatch(match.id)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <h5 class="section-title">
        <q-icon name="history" size="24px" />
        Actividad Reciente
      </h5>

      <q-card class="activity-card">
        <q-list separator>
          <q-item v-for="activity in recentActivity" :key="activity.id">
            <q-item-section avatar>
              <q-avatar :color="activity.color" text-color="white">
                <q-icon :name="activity.icon" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ activity.title }}</q-item-label>
              <q-item-label caption>{{ activity.description }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>{{ activity.time }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'

const router = useRouter()
const userStore = useUserStore()
const databaseStore = useDatabaseStore()

// User data
const userPhotoURL = computed(() => {
  return databaseStore.userData?.photoURL || userStore.user?.photoURL || null
})

// Mock data - Replace with real data from Firestore/API
const stats = ref({
  activeTournaments: 3,
  totalTeams: 24,
  totalMatches: 48,
  totalPlayers: 312
})

const myTournaments = ref([
  {
    id: 't1',
    name: 'Copa Veteranos Tunja 2025',
    teams: 16,
    matches: 32,
    status: 'En curso',
    statusColor: 'positive'
  },
  {
    id: 't2',
    name: 'Liga Local Primavera',
    teams: 8,
    matches: 14,
    status: 'Por iniciar',
    statusColor: 'warning'
  },
  {
    id: 't3',
    name: 'Torneo Relámpago',
    teams: 12,
    matches: 24,
    status: 'Finalizado',
    statusColor: 'grey-6'
  }
])

const upcomingMatches = ref([
  {
    id: 'm1',
    tournament: 'Copa Veteranos',
    date: '22 Oct 2025',
    time: '15:00',
    homeTeam: 'Colo Colo',
    awayTeam: 'Tigres FC',
    field: 'Cancha Principal'
  },
  {
    id: 'm2',
    tournament: 'Liga Primavera',
    date: '23 Oct 2025',
    time: '18:30',
    homeTeam: 'Real Central',
    awayTeam: 'Atlético Norte',
    field: 'Estadio Norte'
  },
  {
    id: 'm3',
    tournament: 'Copa Veteranos',
    date: '25 Oct 2025',
    time: '16:00',
    homeTeam: 'Ind. Valle',
    awayTeam: 'Leones FC',
    field: 'Cancha 2'
  }
])

const recentActivity = ref([
  {
    id: 'a1',
    icon: 'sports_soccer',
    color: 'positive',
    title: 'Partido finalizado',
    description: 'Colo Colo 3 - 2 Ind. Valle',
    time: 'Hace 2 horas'
  },
  {
    id: 'a2',
    icon: 'group_add',
    color: 'info',
    title: 'Nuevo equipo registrado',
    description: 'Tigres FC se unió a Copa Veteranos',
    time: 'Hace 5 horas'
  },
  {
    id: 'a3',
    icon: 'edit_calendar',
    color: 'warning',
    title: 'Partido reprogramado',
    description: 'Real Central vs Atlético Norte',
    time: 'Ayer'
  },
  {
    id: 'a4',
    icon: 'emoji_events',
    color: 'primary',
    title: 'Torneo creado',
    description: 'Liga Local Primavera',
    time: 'Hace 2 días'
  }
])

// Navigation functions
function goToTournaments() {
  void router.push('/manager/tournaments')
}

function goToSchedule() {
  void router.push('/manager/tournaments/schedule')
}

function goToTeams() {
  void router.push('/manager/teams')
}

function goToTournament(id: string) {
  void router.push(`/manager/tournaments/${id}`)
}

function createTournament() {
  void router.push('/manager/tournaments/create')
}

function scheduleMatch() {
  void router.push('/manager/tournaments/schedule')
}

function editMatch(_id: string) {
  // TODO: Open edit match dialog
  console.log('Edit match')
}
</script>

<style scoped lang="scss">
.manager-dashboard {
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

.manager-avatar {
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

  &.tournaments {
    background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%);
  }

  &.schedule {
    background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
  }

  &.teams {
    background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%);
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

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.8rem;
  color: #666;
  flex-wrap: wrap;
  gap: 8px;
}

.match-tournament {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #064F34;
}

.match-date-time {
  display: flex;
  align-items: center;
  gap: 6px;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
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
}

.team-name {
  font-size: 0.95rem;
  color: #333;
  font-weight: 600;
}

.match-vs {
  font-size: 0.75rem;
  font-weight: 600;
  color: #999;
  padding: 0 8px;
}

.match-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

// Activity Section
.activity-section {
  padding: 0 16px 32px 16px;
}

.activity-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

  .match-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .match-teams {
    gap: 8px;
  }

  .team-name {
    font-size: 0.85rem;
  }
}
</style>
