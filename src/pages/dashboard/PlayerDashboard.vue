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
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/boot/firebase'

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

// Match display interface
interface DisplayMatch {
  id: string
  date: string
  time?: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  myTeam: 'home' | 'away'
  field?: string
  hasVideo?: boolean
}

// Real data from Firestore
const upcomingMatches = ref<DisplayMatch[]>([])
const recentMatches = ref<DisplayMatch[]>([])
const loading = ref(false)

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

function goToMatchStats() {
  void router.push('/player/tournaments/stats')
}

// Helper function to format date
function formatDate(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date
  const day = d.getDate()
  const month = d.toLocaleDateString('es', { month: 'short' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// Helper function to format time
function formatTime(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// Load player's matches
async function loadPlayerMatches() {
  if (!userStore.user?.uid) return

  loading.value = true
  try {
    // 1. Get player participations to find their teams
    const participationsRef = collection(db, 'playerParticipations')
    const participationsQuery = query(
      participationsRef,
      where('playerId', '==', userStore.user.uid)
    )
    const participationsSnapshot = await getDocs(participationsQuery)

    if (participationsSnapshot.empty) {
      console.log('[PlayerDashboard] No participations found for player')
      upcomingMatches.value = []
      recentMatches.value = []
      return
    }

    // Get all team IDs where player participates
    const teamIds = new Set<string>()
    participationsSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.teamId) {
        teamIds.add(data.teamId)
      }
    })

    if (teamIds.size === 0) {
      console.log('[PlayerDashboard] No teams found in participations')
      upcomingMatches.value = []
      recentMatches.value = []
      return
    }

    const teamIdsArray = Array.from(teamIds)
    console.log('[PlayerDashboard] Found teams:', teamIdsArray)

    // 2. Get ALL matches and filter by player's teams
    const matchesRef = collection(db, 'matches')
    const allMatchesQuery = query(matchesRef)
    const allMatchesSnapshot = await getDocs(allMatchesQuery)

    console.log('[PlayerDashboard] Total matches in DB:', allMatchesSnapshot.size)

    const upcoming: DisplayMatch[] = []
    const recent: DisplayMatch[] = []
    const now = new Date()

    for (const matchDoc of allMatchesSnapshot.docs) {
      const matchData = matchDoc.data()

      // Check if player's team is in this match
      const isPlayerMatch = teamIdsArray.includes(matchData.homeTeamId as string) || teamIdsArray.includes(matchData.awayTeamId as string)

      if (!isPlayerMatch) continue

      console.log('[PlayerDashboard] Found player match:', matchDoc.id)

      // Get team names
      const homeTeamDoc = await getDocs(query(collection(db, 'teams'), where('id', '==', matchData.homeTeamId)))
      const awayTeamDoc = await getDocs(query(collection(db, 'teams'), where('id', '==', matchData.awayTeamId)))

      const homeTeamData = homeTeamDoc.docs[0]?.data()
      const awayTeamData = awayTeamDoc.docs[0]?.data()

      const homeTeamName = homeTeamData?.name || 'Equipo Local'
      const awayTeamName = awayTeamData?.name || 'Equipo Visitante'

      const matchDate = new Date(matchData.dateISO as string)

      if (matchDate > now) {
        // Upcoming match
        const displayMatch: DisplayMatch = {
          id: matchDoc.id,
          date: formatDate(matchDate),
          time: formatTime(matchDate),
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          myTeam: teamIdsArray.includes(matchData.homeTeamId as string) ? 'home' : 'away'
        }

        if (matchData.field) {
          displayMatch.field = matchData.field as string
        }

        upcoming.push(displayMatch)
      } else {
        // Past match
        recent.push({
          id: matchDoc.id,
          date: formatDate(matchDate),
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeScore: (matchData.homeScore as number) || 0,
          awayScore: (matchData.awayScore as number) || 0,
          myTeam: teamIdsArray.includes(matchData.homeTeamId as string) ? 'home' : 'away',
          hasVideo: !!(matchData.veoMatchId)
        })
      }
    }

    // Sort upcoming by date ascending
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    upcomingMatches.value = upcoming.slice(0, 3)
    recentMatches.value = recent.slice(0, 3)

    console.log('[PlayerDashboard] Loaded matches:', {
      upcoming: upcomingMatches.value.length,
      recent: recentMatches.value.length
    })
  } catch (error) {
    console.error('[PlayerDashboard] Error loading matches:', error)
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(() => {
  console.log('[PlayerDashboard] Mounted - loading player matches')
  void loadPlayerMatches()
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
  padding: 32px 24px;
  margin: -16px -16px 24px -16px;
  color: white;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 8px;
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
