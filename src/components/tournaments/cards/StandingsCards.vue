<template>
  <div class="standings-cards">
    <q-card
      v-for="r in rows"
      :key="r.teamId"
      class="standing-card"
      :class="getCardClass(r.pos)"
    >
      <div class="card-header">
        <div class="position-badge" :class="getPositionBadgeClass(r.pos)">
          <div class="position-number">#{{ r.pos }}</div>
        </div>
        <div class="points-section">
          <div class="points-value">{{ r.points }}</div>
          <div class="points-label">PTS</div>
        </div>
      </div>

      <div class="team-info">
        <q-avatar size="56px" class="team-crest">
          <img v-if="r.crestUrl" :src="r.crestUrl" alt="crest" />
          <q-icon v-else name="shield" size="40px" color="grey-4" />
        </q-avatar>
        <div class="team-name">{{ r.teamName }}</div>
      </div>

      <q-separator class="q-my-md" />

      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">PJ</div>
          <div class="stat-value">{{ r.played }}</div>
        </div>
        <div class="stat-item stat-highlight">
          <div class="stat-label">PG</div>
          <div class="stat-value text-positive">{{ r.won }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">PE</div>
          <div class="stat-value text-warning">{{ r.draw }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">PP</div>
          <div class="stat-value text-negative">{{ r.lost }}</div>
        </div>
      </div>

      <div class="stats-grid q-mt-sm">
        <div class="stat-item">
          <div class="stat-label">GF</div>
          <div class="stat-value">{{ r.goalsFor }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">GC</div>
          <div class="stat-value">{{ r.goalsAgainst }}</div>
        </div>
        <div class="stat-item stat-highlight">
          <div class="stat-label">DG</div>
          <div class="stat-value" :class="r.goalDiff >= 0 ? 'text-positive' : 'text-negative'">
            {{ r.goalDiff >= 0 ? '+' : '' }}{{ r.goalDiff }}
          </div>
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { StandingRow } from '@/utils/standings'
type Row = StandingRow & { teamName: string; crestUrl: string | null; pos: number }
defineProps<{ rows: Row[] }>()

function getCardClass(pos: number): string {
  if (pos === 1) return 'first-place'
  if (pos <= 3) return 'top-three'
  return ''
}

function getPositionBadgeClass(pos: number): string {
  if (pos === 1) return 'gold-badge'
  if (pos === 2) return 'silver-badge'
  if (pos === 3) return 'bronze-badge'
  return 'default-badge'
}
</script>

<style scoped lang="scss">
.standings-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.standing-card {
  border-radius: 16px;
  padding: 20px;
  background: white;
  border: 2px solid #E0E0E0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #E0E0E0;
  }

  &.first-place {
    border-color: #FFD700;
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);

    &::before {
      background: linear-gradient(90deg, #FFD700, #FFA500);
    }
  }

  &.top-three {
    border-color: #21BA45;

    &::before {
      background: linear-gradient(90deg, #21BA45, #16A34A);
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.position-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;

  &.gold-badge {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    box-shadow: 0 4px 12px rgba(255, 165, 0, 0.4);
  }

  &.silver-badge {
    background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
    color: white;
    box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
  }

  &.bronze-badge {
    background: linear-gradient(135deg, #CD7F32, #B87333);
    color: white;
    box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
  }

  &.default-badge {
    background: #F5F5F5;
    color: #616161;
    border: 2px solid #E0E0E0;
  }
}

.position-number {
  font-weight: 800;
}

.points-section {
  text-align: right;
}

.points-value {
  font-size: 2rem;
  font-weight: 800;
  color: #064F34;
  line-height: 1;
}

.points-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.team-crest {
  border: 3px solid #E0E0E0;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.team-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #212121;
  line-height: 1.3;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: #FAFAFA;
  border-radius: 8px;
  transition: all 0.2s ease;

  &.stat-highlight {
    background: linear-gradient(135deg, #F0F8FF, #E8F5E9);
  }

  &:hover {
    background: #F0F0F0;
    transform: scale(1.05);
  }
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #212121;
}

// Mobile responsive
@media (max-width: 600px) {
  .standings-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .standing-card {
    padding: 16px;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-item {
    padding: 6px;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .points-value {
    font-size: 1.75rem;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .standings-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
