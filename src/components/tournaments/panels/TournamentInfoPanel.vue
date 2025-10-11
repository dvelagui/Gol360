<template>
  <div class="q-pa-none">
    <div v-if="isLoading" class="q-my-xl">
      <q-skeleton type="rect" class="q-mb-md" height="180px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
      <q-skeleton type="rect" class="q-mb-md" height="120px" />
    </div>

    <div v-else-if="!tournament" class="q-my-xl text-grey-6 text-center">
      <q-icon name="info" size="48px" class="q-mb-md text-grey-4" />
      <div class="text-subtitle2">No hay torneo seleccionado</div>
      <div class="text-caption">Selecciona un torneo en el menú superior.</div>
    </div>

    <div v-else class="container-info">

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-card class="info-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="info" class="q-mr-xs" />
                Información General
              </div>
              <div class="info-row">
                <div class="info-label">
                  <q-icon name="account_box" size="20px" class="q-mr-xs" />
                  Nombre:
                </div>
                <div class="info-value">{{ tournament.displayName }}</div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="info-row">
                <div class="info-label">
                  <q-icon name="event" size="20px" class="q-mr-xs" />
                  Fecha de inicio
                </div>
                <div class="info-value">{{ formatDate(tournament.startDate) }}</div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="info-row">
                <div class="info-label">
                  <q-icon name="location_on" size="20px" class="q-mr-xs" />
                  Lugar
                </div>
                <div class="info-value">{{ tournament.city || '—' }}</div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="info-row">
                <div class="info-label">
                  <q-icon name="category" size="20px" class="q-mr-xs" />
                  Categoría
                </div>
                <div class="info-value">{{ tournament.category || '—' }}</div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="info-row">
                <div class="info-label">
                  <q-icon name="calendar_today" size="20px" class="q-mr-xs" />
                  Temporada
                </div>
                <div class="info-value">{{ tournament.season || '—' }}</div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="info-row">
                <div class="info-label">
                  <q-icon name="sports" size="20px" class="q-mr-xs" />
                  Tipo de competición
                </div>
                <div class="info-value">{{ getTournamentType(tournament.type) }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="info-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="groups" class="q-mr-xs" />
                Equipos
              </div>

              <div class="teams-summary">
                <div class="teams-count">
                  <div class="count-number">{{ registeredTeams }}</div>
                  <div class="count-label">Equipos Registrados</div>
                </div>

                <q-separator vertical class="q-mx-md" />

                <div class="teams-count">
                  <div class="count-number">{{ tournament.numTeams }}</div>
                  <div class="count-label">Total Esperado</div>
                </div>
              </div>

              <q-linear-progress
                :value="teamsProgress"
                size="12px"
                :color="teamsProgress === 1 ? 'positive' : 'primary'"
                class="q-mt-md rounded-progress"
              />

              <div class="text-center text-caption text-grey-7 q-mt-sm">
                <span v-if="remainingTeams > 0">
                  Faltan <strong>{{ remainingTeams }}</strong> equipos para completar
                </span>
                <span v-else class="text-positive text-weight-bold">
                  ¡Todos los equipos registrados!
                </span>
              </div>
            </q-card-section>
          </q-card>

          <q-card class="info-card q-mt-md" flat bordered>
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="flag" class="q-mr-xs" />
                Estado
              </div>

              <div class="text-center q-py-md">
                <q-badge
                  :color="getStatusColor(tournament.status)"
                  text-color="white"
                  class="text-h6 q-pa-md"
                  style="border-radius: 8px;"
                >
                  {{ getStatusLabel(tournament.status) }}
                </q-badge>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="tournament.description" class="col-12">
          <q-card class="info-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="description" class="q-mr-xs" />
                Descripción
              </div>
              <div class="text-body2 text-grey-8">
                {{ tournament.description }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="tournament.award" class="col-12">
          <q-card class="info-card awards-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="workspace_premium" class="q-mr-xs" />
                Premiación
              </div>

              <div class="row q-col-gutter-md">
                <div v-if="tournament.award.first_place" class="col-12 col-sm-6 col-md-3">
                  <div class="award-item first-place">
                    <div class="award-icon">
                      <q-icon name="emoji_events" size="32px" />
                    </div>
                    <div class="award-label">1er Lugar</div>
                    <div class="award-amount">{{ formatCurrency(tournament.award.first_place) }}</div>
                  </div>
                </div>

                <div v-if="tournament.award.second_place" class="col-12 col-sm-6 col-md-3">
                  <div class="award-item second-place">
                    <div class="award-icon">
                      <q-icon name="emoji_events" size="32px" />
                    </div>
                    <div class="award-label">2do Lugar</div>
                    <div class="award-amount">{{ formatCurrency(tournament.award.second_place) }}</div>
                  </div>
                </div>

                <div v-if="tournament.award.top_scorer" class="col-12 col-sm-6 col-md-3">
                  <div class="award-item top-scorer">
                    <div class="award-icon">
                      <q-icon name="sports_soccer" size="32px" />
                    </div>
                    <div class="award-label">Goleador</div>
                    <div class="award-amount">{{ formatCurrency(tournament.award.top_scorer) }}</div>
                  </div>
                </div>

                <div v-if="tournament.award.defeat_net" class="col-12 col-sm-6 col-md-3">
                  <div class="award-item defeat-net">
                    <div class="award-icon">
                      <q-icon name="shield" size="32px" />
                    </div>
                    <div class="award-label">Valla Invicta</div>
                    <div class="award-amount">{{ formatCurrency(tournament.award.defeat_net) }}</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="tournament.managerName" class="col-12">
          <q-card class="info-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="person" class="q-mr-xs" />
                Organizador
              </div>
              <div class="text-body1 text-grey-8">
                <q-icon name="account_circle" class="q-mr-sm" />
                {{ tournament.managerName }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tournament } from '@/types/auth'

interface Props {
  tournament: Tournament | null
  registeredTeams?: number
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  registeredTeams: 0,
  isLoading: false
})

// Computed properties
const remainingTeams = computed(() =>
  Math.max((props.tournament?.numTeams ?? 0) - props.registeredTeams, 0)
)

const teamsProgress = computed(() => {
  const total = props.tournament?.numTeams ?? 1
  return total > 0 ? props.registeredTeams / total : 0
})

// Helper functions
function getTournamentType(type?: 'league' | 'league_playoff' | 'playoff' | ''): string {
  const types: Record<string, string> = {
    league: 'Liga',
    league_playoff: 'Liga + Playoff',
    playoff: 'Playoff',
    '': 'Por definir'
  }
  return types[type || ''] || 'Sin definir'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'

  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'positive',
    upcoming: 'primary',
    finished: 'grey',
    cancelled: 'negative'
  }
  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'En Curso',
    upcoming: 'Próximamente',
    finished: 'Finalizado',
    cancelled: 'Cancelado'
  }
  return labels[status?.toLowerCase()] || status || 'Sin definir'
}
</script>

<style scoped lang="scss">
.container-info {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.info-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .06);
  transition: transform .12s ease, box-shadow .12s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, .10);
  }
}

.header-card {
  position: relative;
  min-height: 160px;
  overflow: hidden;
  background: linear-gradient(135deg, #064F34, #138A59);
}

.header-overlay {
  position: absolute;
  inset: 0;
  padding: 24px;
  display: flex;
  align-items: center;
  background: radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, .12), transparent 40%);
}

.header-content {
  width: 100%;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 36px;
}

.info-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #616161;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #212121;
  font-weight: 600;
  text-align: right;
}

.teams-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px;
  background: rgba(25, 118, 210, 0.05);
  border-radius: 12px;
}

.teams-count {
  text-align: center;
}

.count-number {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--q-primary);
  line-height: 1;
}

.count-label {
  font-size: 0.75rem;
  color: #616161;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rounded-progress {
  border-radius: 6px;
}

.awards-card {
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
}

.award-item {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  &.first-place {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    border-color: #FFD700;

    .award-icon {
      color: #fff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  &.second-place {
    background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%);
    border-color: #C0C0C0;

    .award-icon {
      color: #fff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  &.top-scorer {
    background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
    border-color: #1976D2;

    .award-icon, .award-label, .award-amount {
      color: #fff;
    }
  }

  &.defeat-net {
    background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
    border-color: #064F34;

    .award-icon, .award-label, .award-amount {
      color: #fff;
    }
  }
}

.award-icon {
  margin-bottom: 8px;
}

.award-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.award-amount {
  font-size: 1.25rem;
  font-weight: 900;
}

@media (max-width: 600px) {
  .header-card {
    min-height: 140px;
  }

  .header-overlay {
    padding: 16px;
  }

  .teams-summary {
    flex-direction: column;
    gap: 16px;
  }

  .count-number {
    font-size: 2rem;
  }
}
</style>
