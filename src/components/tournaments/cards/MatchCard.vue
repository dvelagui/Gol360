<template>
  <div class="match-card">
    <div class="match-content">
      <div class="team home-team">
        <div class="team-avatar">
          <q-avatar v-if="homeCrest" size="48px" class="team-crest">
            <img :src="homeCrest" />
          </q-avatar>
          <q-avatar v-else size="48px" class="team-crest default-crest">
            <q-icon name="shield" size="32px" />
          </q-avatar>
        </div>
        <div class="team-name">
          {{ homeName }}
        </div>
      </div>

      <div class="score-section">
        <div class="score-container">
          <div class="score-box home-score">
            {{ homeScoreDisplay !== null ? homeScoreDisplay : '-' }}
          </div>
          <div class="score-divider">VS</div>
          <div class="score-box away-score">
            {{ awayScoreDisplay !== null ? awayScoreDisplay : '-' }}
          </div>
        </div>
        <div v-if="match.status === 'terminado'" class="match-status completed">
          Finalizado
        </div>
        <div v-else-if="match.status === 'en progreso'" class="match-status in-progress">
          En juego
        </div>
        <div v-else class="match-status">
          Por jugar
        </div>
      </div>

      <div class="team away-team">
        <div class="team-avatar">
          <q-avatar v-if="awayCrest" size="48px" class="team-crest">
            <img :src="awayCrest" />
          </q-avatar>
          <q-avatar v-else size="48px" class="team-crest default-crest">
            <q-icon name="shield" size="32px" />
          </q-avatar>
        </div>
        <div class="team-name">
          {{ awayName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Match } from '@/types/competition'

const props = defineProps<{
  match: Match
  teamById: (id: string) => { id: string; name: string; crestUrl?: string } | undefined
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'results'): void
}>()

/* Resolución de nombres/escudos soportando los dos formatos:
   - match.homeTeamId: string
   - match.homeTeamId: { id, name }
*/
type TeamIdType = string | { id: string; name: string; crestUrl?: string };

const homeObj = computed(() => {
  const v = props.match.homeTeamId as TeamIdType

  // Extract ID whether it's a string or object
  const teamId = typeof v === 'string' ? v : v?.id

  if (teamId) {
    // Always lookup in teamsMap to get full data including crestUrl
    const team = props.teamById(teamId)
    if (team) return team
  }

  // Fallback to object data if no lookup found
  if (v && typeof v === 'object') return v

  return { id: '', name: 'Equipo' }
})
const awayObj = computed(() => {
  const v = props.match.awayTeamId as TeamIdType

  // Extract ID whether it's a string or object
  const teamId = typeof v === 'string' ? v : v?.id

  if (teamId) {
    // Always lookup in teamsMap to get full data including crestUrl
    const team = props.teamById(teamId)
    if (team) return team
  }

  // Fallback to object data if no lookup found
  if (v && typeof v === 'object') return v

  return { id: '', name: 'Equipo' }
})

const homeName = computed(() => homeObj.value?.name ?? 'Local')
const awayName = computed(() => awayObj.value?.name ?? 'Visitante')

const homeCrest = computed(() => homeObj.value?.crestUrl)
const awayCrest = computed(() => awayObj.value?.crestUrl)

const homeScoreDisplay = computed(() => {
  const score = props.match.score?.home
  return score !== undefined && score !== null ? score : null
})
const awayScoreDisplay = computed(() => {
  const score = props.match.score?.away
  return score !== undefined && score !== null ? score : null
})



</script>

<style scoped lang="scss">
.match-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
}

.match-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.team {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.team-avatar {
  position: relative;
}

.team-crest {
  border: 3px solid #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.default-crest {
  background: linear-gradient(135deg, #e0e0e0, #bdbdbd);
  color: #757575;
}

.team-name {
  font-size: 0.875rem;
  font-weight: 700;
  text-align: center;
  color: #212121;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.score-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(6, 79, 52, 0.08), rgba(19, 138, 89, 0.08));
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid rgba(6, 79, 52, 0.15);
}

.score-box {
  min-width: 40px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 900;
  color: #064F34;
  background: white;
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(6, 79, 52, 0.1);
}

.score-divider {
  font-size: 0.75rem;
  font-weight: 700;
  color: #138A59;
  padding: 0 4px;
  letter-spacing: 1px;
}

.match-status {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(158, 158, 158, 0.15);
  color: #757575;
  letter-spacing: 0.5px;

  &.completed {
    background: rgba(76, 175, 80, 0.15);
    color: #2e7d32;
  }

  &.in-progress {
    background: rgba(255, 152, 0, 0.15);
    color: #e65100;
  }
}

@media (max-width: 600px) {
  .match-card {
    padding: 12px;
  }

  .match-content {
    gap: 8px;
  }

  .team-crest {
    width: 40px !important;
    height: 40px !important;
    font-size: 40px !important;
    border-width: 2px;
  }

  .default-crest .q-icon {
    font-size: 24px !important;
  }

  .team-name {
    font-size: 0.75rem;
    line-clamp: 2;
  }

  .score-container {
    padding: 8px 12px;
    gap: 6px;
  }

  .score-box {
    min-width: 32px;
    height: 40px;
    font-size: 1.5rem;
  }

  .score-divider {
    font-size: 0.688rem;
    padding: 0 2px;
  }

  .match-status {
    font-size: 0.688rem;
    padding: 3px 8px;
  }
}

@media (max-width: 400px) {
  .match-content {
    gap: 6px;
  }

  .team-crest {
    width: 36px !important;
    height: 36px !important;
    font-size: 36px !important;
  }

  .default-crest .q-icon {
    font-size: 20px !important;
  }

  .team-name {
    font-size: 0.688rem;
  }

  .score-box {
    min-width: 28px;
    height: 36px;
    font-size: 1.25rem;
  }
}
</style>
