<template>
  <q-page class="admin-dashboard">
    <div class="dashboard-hero">
      <div class="hero-content">
        <div class="welcome-section">
          <h4 class="welcome-title">Panel de Administración</h4>
          <p class="welcome-subtitle">Control total del sistema GOL360</p>
        </div>
        <q-avatar size="64px" class="admin-avatar">
          <img v-if="userPhotoURL" :src="userPhotoURL" />
          <q-icon v-else name="admin_panel_settings" size="32px" />
        </q-avatar>
      </div>
    </div>

    <div class="main-actions-section">
      <div class="main-actions-grid">
        <q-card class="main-action-card" @click="goToUsers">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper users">
              <q-icon name="supervised_user_circle" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">Usuarios</div>
              <div class="action-subtitle">Gestionar</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="main-action-card" @click="goToTournaments">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper tournaments">
              <q-icon name="emoji_events" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">Torneos</div>
              <div class="action-subtitle">Supervisar</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="main-action-card" @click="goToScraping">
          <q-card-section class="main-action-content">
            <div class="action-icon-wrapper scraping">
              <q-icon name="cloud_download" size="36px" />
            </div>
            <div class="action-text">
              <div class="action-title">Scraping</div>
              <div class="action-subtitle">Datos VEO</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="stats-section">
      <h5 class="section-title">
        <q-icon name="dashboard" size="24px" />
        Métricas del Sistema
      </h5>
      <div class="stats-grid-extended">
        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="people" size="32px" color="primary" />
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalUsers }}</div>
              <div class="stat-label">Usuarios</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="emoji_events" size="32px" color="warning" />
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalTournaments }}</div>
              <div class="stat-label">Torneos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="groups" size="32px" color="info" />
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalTeams }}</div>
              <div class="stat-label">Equipos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="sports_soccer" size="32px" color="positive" />
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalMatches }}</div>
              <div class="stat-label">Partidos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="videocam" size="32px" color="negative" />
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalVideos }}</div>
              <div class="stat-label">Videos</div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section class="stat-content">
            <q-icon name="storage" size="32px" color="secondary" />
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.storageUsed }}</div>
              <div class="stat-label">Storage</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="quick-actions-section">
      <h5 class="section-title">
        <q-icon name="speed" size="24px" />
        Acciones Rápidas
      </h5>
      <div class="quick-actions-grid">
        <q-btn
          unelevated
          color="primary"
          icon="person_add"
          label="Registrar Usuario"
          class="quick-action-btn"
          @click="registerUser"
        />
        <q-btn
          unelevated
          color="warning"
          icon="add"
          label="Crear Torneo"
          class="quick-action-btn"
          @click="createTournament"
        />
        <q-btn
          unelevated
          color="info"
          icon="cloud_sync"
          label="Sincronizar VEO"
          class="quick-action-btn"
          @click="syncVEO"
        />
        <q-btn
          unelevated
          color="positive"
          icon="analytics"
          label="Ver Reportes"
          class="quick-action-btn"
          @click="viewReports"
        />
      </div>
    </div>

    <div class="two-column-layout">
      <div class="users-section">
        <div class="section-header">
          <h5 class="section-title">
            <q-icon name="people" size="24px" />
            Usuarios Recientes
          </h5>
          <q-btn
            flat
            dense
            color="primary"
            icon="open_in_new"
            label="Ver todos"
            size="sm"
            @click="goToUsers"
          />
        </div>

        <q-card class="content-card">
          <q-list separator>
            <q-item
              v-for="user in recentUsers"
              :key="user.id"
              clickable
              @click="goToUser(user.id)"
            >
              <q-item-section avatar>
                <q-avatar>
                  <img v-if="user.avatar" :src="user.avatar" />
                  <q-icon v-else name="person" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
                <q-item-label caption>{{ user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="getRoleColor(user.role)" :label="user.role.toUpperCase()" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="tournaments-section">
        <div class="section-header">
          <h5 class="section-title">
            <q-icon name="emoji_events" size="24px" />
            Torneos Activos
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

        <q-card class="content-card">
          <q-list separator>
            <q-item
              v-for="tournament in activeTournaments"
              :key="tournament.id"
              clickable
              @click="goToTournament(tournament.id)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  <q-icon name="emoji_events" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ tournament.name }}</q-item-label>
                <q-item-label caption>
                  {{ tournament.teams }} equipos · {{ tournament.matches }} partidos
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <div class="scraping-section">
      <div class="section-header">
        <h5 class="section-title">
          <q-icon name="cloud_download" size="24px" />
          Jobs de Scraping Recientes
        </h5>
        <q-btn
          flat
          dense
          color="primary"
          icon="refresh"
          label="Actualizar"
          size="sm"
          @click="refreshJobs"
        />
      </div>

      <q-card class="content-card">
        <q-list separator>
          <q-item v-for="job in scrapingJobs" :key="job.id">
            <q-item-section avatar>
              <q-avatar :color="getJobStatusColor(job.status)" text-color="white">
                <q-icon :name="getJobStatusIcon(job.status)" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ job.matchName }}</q-item-label>
              <q-item-label caption>
                {{ job.tournament }} · Job ID: {{ job.jobId }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="job-info">
                <q-badge
                  :color="getJobStatusColor(job.status)"
                  :label="job.status"
                />
                <q-item-label caption>{{ job.time }}</q-item-label>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <div class="activity-section">
      <h5 class="section-title">
        <q-icon name="history" size="24px" />
        Log de Actividad del Sistema
      </h5>

      <q-card class="content-card">
        <q-list separator>
          <q-item v-for="activity in systemActivity" :key="activity.id">
            <q-item-section avatar>
              <q-avatar :color="activity.color" text-color="white" size="36px">
                <q-icon :name="activity.icon" size="20px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ activity.title }}</q-item-label>
              <q-item-label caption>{{ activity.description }}</q-item-label>
            </q-item-section>
            <q-item-section side top>
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
const systemStats = ref({
  totalUsers: 612,
  totalTournaments: 48,
  totalTeams: 384,
  totalMatches: 1256,
  totalVideos: 892,
  storageUsed: '45 GB'
})

const recentUsers = ref([
  {
    id: 'u1',
    name: 'Carlos Rodríguez',
    email: 'carlos@email.com',
    role: 'manager',
    avatar: ''
  },
  {
    id: 'u2',
    name: 'Ana García',
    email: 'ana@email.com',
    role: 'player',
    avatar: ''
  },
  {
    id: 'u3',
    name: 'Luis Martínez',
    email: 'luis@email.com',
    role: 'team',
    avatar: ''
  },
  {
    id: 'u4',
    name: 'María López',
    email: 'maria@email.com',
    role: 'manager',
    avatar: ''
  },
  {
    id: 'u5',
    name: 'Jorge Pérez',
    email: 'jorge@email.com',
    role: 'player',
    avatar: ''
  }
])

const activeTournaments = ref([
  {
    id: 't1',
    name: 'Copa Veteranos Tunja 2025',
    teams: 16,
    matches: 32
  },
  {
    id: 't2',
    name: 'Liga Local Primavera',
    teams: 12,
    matches: 24
  },
  {
    id: 't3',
    name: 'Torneo Nacional',
    teams: 24,
    matches: 48
  },
  {
    id: 't4',
    name: 'Copa Regional',
    teams: 8,
    matches: 14
  }
])

const scrapingJobs = ref([
  {
    id: 'j1',
    jobId: 'job-2025-001',
    matchName: 'Colo Colo vs Ind. Valle',
    tournament: 'Copa Veteranos',
    status: 'completed',
    time: 'Hace 30 min'
  },
  {
    id: 'j2',
    jobId: 'job-2025-002',
    matchName: 'Tigres FC vs Real Central',
    tournament: 'Liga Primavera',
    status: 'processing',
    time: 'En proceso'
  },
  {
    id: 'j3',
    jobId: 'job-2025-003',
    matchName: 'Atlético Norte vs Leones',
    tournament: 'Copa Veteranos',
    status: 'failed',
    time: 'Hace 1 hora'
  },
  {
    id: 'j4',
    jobId: 'job-2025-004',
    matchName: 'Deportivo vs Académica',
    tournament: 'Torneo Nacional',
    status: 'completed',
    time: 'Hace 2 horas'
  }
])

const systemActivity = ref([
  {
    id: 'a1',
    icon: 'person_add',
    color: 'primary',
    title: 'Nuevo usuario registrado',
    description: 'Carlos Rodríguez (manager) se registró en el sistema',
    time: 'Hace 15 min'
  },
  {
    id: 'a2',
    icon: 'cloud_done',
    color: 'positive',
    title: 'Scraping completado',
    description: 'Job job-2025-001 procesado exitosamente',
    time: 'Hace 30 min'
  },
  {
    id: 'a3',
    icon: 'emoji_events',
    color: 'warning',
    title: 'Torneo creado',
    description: 'Liga Local Primavera creado por Ana García',
    time: 'Hace 1 hora'
  },
  {
    id: 'a4',
    icon: 'error',
    color: 'negative',
    title: 'Error en scraping',
    description: 'Job job-2025-003 falló - reintentar',
    time: 'Hace 1 hora'
  },
  {
    id: 'a5',
    icon: 'group_add',
    color: 'info',
    title: 'Equipo registrado',
    description: 'Tigres FC añadido a Copa Veteranos',
    time: 'Hace 2 horas'
  },
  {
    id: 'a6',
    icon: 'sports_soccer',
    color: 'positive',
    title: 'Partido finalizado',
    description: 'Colo Colo 3 - 2 Ind. Valle',
    time: 'Hace 3 horas'
  }
])

// Utility functions
function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'negative',
    manager: 'primary',
    team: 'info',
    player: 'positive'
  }
  return colors[role] || 'grey'
}

function getJobStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'positive',
    processing: 'info',
    failed: 'negative',
    pending: 'warning'
  }
  return colors[status] || 'grey'
}

function getJobStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    completed: 'check_circle',
    processing: 'sync',
    failed: 'error',
    pending: 'schedule'
  }
  return icons[status] || 'help'
}

// Navigation functions
function goToUsers() {
  void router.push('/admin/users')
}

function goToTournaments() {
  void router.push('/admin/tournaments')
}

function goToScraping() {
  void router.push('/admin/scraping')
}

function goToUser(id: string) {
  void router.push(`/admin/users/${id}`)
}

function goToTournament(id: string) {
  void router.push(`/admin/tournaments/${id}`)
}

function registerUser() {
  void router.push('/admin/users/register')
}

function createTournament() {
  void router.push('/admin/tournaments/create')
}

function syncVEO() {
  void router.push('/admin/scraping')
}

function viewReports() {
  void router.push('/admin/reports')
}

function refreshJobs() {
  // TODO: Refresh scraping jobs
  console.log('Refreshing jobs...')
}
</script>

<style scoped lang="scss">
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

// Hero Section
.dashboard-hero {
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  padding: 32px 16px;
  margin: -16px -16px 24px -16px;
  color: white;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
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

.admin-avatar {
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
    background: linear-gradient(90deg, #DC2626 0%, #B91C1C 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.2);

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

  &.users {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  }

  &.tournaments {
    background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%);
  }

  &.scraping {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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

.stats-grid-extended {
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

// Quick Actions
.quick-actions-section {
  padding: 0 16px;
  margin-bottom: 32px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-action-btn {
  height: 48px;
  font-weight: 600;
  border-radius: 12px;
}

// Two Column Layout
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 0 16px;
  margin-bottom: 32px;
}

.users-section,
.tournaments-section {
  min-width: 0;
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

// Scraping Section
.scraping-section {
  padding: 0 16px;
  margin-bottom: 32px;
}

.job-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

// Activity Section
.activity-section {
  padding: 0 16px 32px 16px;
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

  .stats-grid-extended {
    grid-template-columns: repeat(3, 1fr);
  }

  .quick-actions-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .two-column-layout {
    grid-template-columns: repeat(2, 1fr);
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

@media (min-width: 1024px) {
  .stats-grid-extended {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 599px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
