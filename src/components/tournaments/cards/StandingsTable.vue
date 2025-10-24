<template>
  <div class="standings-table-wrapper">
    <q-table
      flat
      :rows="rows"
      :columns="columns"
      row-key="teamId"
      :rows-per-page-options="[0]"
      hide-pagination
      class="standings-table"
      :class="{ 'mobile-table': $q.screen.lt.md }"
    >
      <template #body-cell-pos="props">
        <q-td :props="props">
          <div class="position-cell" :class="getPositionClass(props.row.pos)">
            {{ props.row.pos }}
          </div>
        </q-td>
      </template>

      <template #body-cell-team="props">
        <q-td :props="props">
          <div class="team-cell">
            <q-avatar size="32px" class="team-avatar">
              <img v-if="props.row.crestUrl" :src="props.row.crestUrl" alt="crest" />
              <q-icon v-else name="shield" color="grey-5" />
            </q-avatar>
            <span class="team-name">{{ props.row.teamName }}</span>
          </div>
        </q-td>
      </template>

      <template #body-cell-pts="props">
        <q-td :props="props">
          <div class="points-cell">
            {{ props.row.points }}
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import type { StandingRow } from '@/utils/standings'

type Row = StandingRow & { teamName: string; crestUrl: string | null; pos: number }
defineProps<{ rows: Row[] }>()

const $q = useQuasar()

const columns: QTableColumn<Row>[] = [
  { name: 'pos',  label: '#',      field: 'pos',         align: 'center', style: 'width: 60px' },
  { name: 'team', label: 'Equipo', field: 'teamName',    align: 'left' },
  { name: 'pts',  label: 'PTS',    field: 'points',      align: 'center', style: 'width: 70px' },
  { name: 'pj',   label: 'PJ',     field: 'played',      align: 'center', style: 'width: 60px' },
  { name: 'pg',   label: 'PG',     field: 'won',         align: 'center', style: 'width: 60px' },
  { name: 'pe',   label: 'PE',     field: 'draw',        align: 'center', style: 'width: 60px' },
  { name: 'pp',   label: 'PP',     field: 'lost',        align: 'center', style: 'width: 60px' },
  { name: 'gf',   label: 'GF',     field: 'goalsFor',    align: 'center', style: 'width: 60px' },
  { name: 'gc',   label: 'GC',     field: 'goalsAgainst',align: 'center', style: 'width: 60px' },
  { name: 'dg',   label: 'DG',     field: 'goalDiff',    align: 'center', style: 'width: 60px' }
]

function getPositionClass(pos: number): string {
  if (pos <= 3) return 'top-position'
  if (pos <= 6) return 'mid-position'
  return 'bottom-position'
}
</script>

<style scoped lang="scss">
.standings-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #E0E0E0;
}

.standings-table {
  :deep(thead) {
    background: linear-gradient(135deg, #064F34, #138A59);

    tr th {
      color: white !important;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 16px 12px;
    }
  }

  :deep(tbody) {
    tr {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #F5F5F5;
      }

      &:nth-child(odd) {
        background-color: #FAFAFA;
      }

      td {
        padding: 12px;
        font-size: 0.9rem;
      }
    }
  }
}

.position-cell {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 0 auto;

  &.top-position {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: white;
    box-shadow: 0 2px 8px rgba(255, 165, 0, 0.3);
  }

  &.mid-position {
    background: linear-gradient(135deg, #21BA45, #16A34A);
    color: white;
  }

  &.bottom-position {
    background: #E0E0E0;
    color: #616161;
  }
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-avatar {
  border: 2px solid #E0E0E0;
  background: white;
}

.team-name {
  font-weight: 600;
  color: #212121;
  font-size: 0.95rem;
}

.points-cell {
  font-weight: 700;
  font-size: 1.1rem;
  color: #064F34;
}

// Mobile adjustments
.mobile-table {
  :deep(thead tr th) {
    font-size: 0.75rem;
    padding: 10px 6px;
  }

  :deep(tbody tr td) {
    padding: 8px 6px;
    font-size: 0.85rem;
  }

  .position-cell {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .team-cell {
    gap: 8px;
  }

  .team-name {
    font-size: 0.85rem;
  }

  .points-cell {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .standings-table {
    :deep(thead tr th) {
      &:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(3)) {
        display: none;
      }
    }

    :deep(tbody tr td) {
      &:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(3)) {
        display: none;
      }
    }
  }
}
</style>
