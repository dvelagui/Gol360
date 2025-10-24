<template>
  <q-dialog v-model="model" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card flat class="event-dialog-card">
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-title">
            <q-icon name="sports_soccer" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-weight-bold">Nuevo Evento</div>
              <div v-if="match" class="text-caption match-info">
                {{ getTeamName(match.homeTeamId) }} vs {{ getTeamName(match.awayTeamId) }}
              </div>
            </div>
          </div>
          <q-btn
            dense
            round
            flat
            icon="close"
            v-close-popup
            class="close-btn"
          >
            <q-tooltip>Cerrar</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-content">
        <div v-if="match" class="form-container">
          <MatchEventForm
            :match-id="match.id"
            :team-home="getTeamObject(match.homeTeamId)"
            :team-away="getTeamObject(match.awayTeamId)"
            :tournament-id="tournamentId"
            :teams="teams"
            :can-approve="canApprove"
            @submit="handleSubmit"
          />
        </div>
        <div v-else class="loading-state">
          <q-spinner-dots size="xl" color="primary" />
          <div class="text-subtitle2 q-mt-md text-grey-6">Cargando información del partido...</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MatchEventForm from '@/components/tournaments/forms/MatchEventForm.vue'
import type { Match, MatchEvent } from '@/types/competition'

const props = defineProps<{
  modelValue: boolean
  match: Match | null
  tournamentId: string
  teams: { id: string; name: string }[]
  canApprove: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', payload: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'propuesto' | 'aprobado' }): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

function getTeamName(teamId: string | { id: string; name: string }): string {
  if (typeof teamId === 'object') return teamId.name
  const team = props.teams.find(t => t.id === teamId)
  return team?.name || 'Equipo'
}

function getTeamObject(teamId: string | { id: string; name: string }): { id: string; name: string } {
  if (typeof teamId === 'object') return teamId
  const team = props.teams.find(t => t.id === teamId)
  return team || { id: teamId, name: 'Equipo' }
}

function handleSubmit(payload: Omit<MatchEvent, 'id' | 'createdAt' | 'status'> & { status?: 'propuesto' | 'aprobado' }) {
  emit('submit', payload)
}
</script>

<style scoped lang="scss">
.event-dialog-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

.dialog-header {
  background: linear-gradient(135deg, #064F34 0%, #138A59 50%, #1976D2 100%);
  color: white;
  padding: 20px;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.match-info {
  opacity: 0.9;
  margin-top: 4px;
  font-weight: 500;
}

.close-btn {
  color: white;
  flex-shrink: 0;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: #f5f5f5;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #064F34;
    border-radius: 4px;

    &:hover {
      background: #138A59;
    }
  }
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

@media (max-width: 600px) {
  .dialog-header {
    padding: 16px;
  }

  .header-title {
    gap: 8px;

    .q-icon {
      font-size: 24px !important;
    }

    .text-h6 {
      font-size: 1.125rem;
    }
  }

  .form-container {
    padding: 16px;
  }
}
</style>
