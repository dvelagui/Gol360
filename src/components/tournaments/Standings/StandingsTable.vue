<template>
  <q-table
    flat
    bordered
    :rows="rows"
    :columns="columns"
    row-key="teamId"
    dense
    separator="horizontal"
  >
    <template #body-cell-team="p">
      <q-td :props="p">
        <div class="row items-center no-wrap q-gutter-x-sm">
          <q-avatar size="26px" v-if="p.row.crestUrl">
            <img :src="p.row.crestUrl" alt="crest" />
          </q-avatar>
          <span class="text-weight-medium">{{ p.row.teamName }}</span>
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { StandingRow } from '@/utils/standings'

type Row = StandingRow & { teamName: string; crestUrl: string | null; pos: number }
defineProps<{ rows: Row[] }>()

const columns: QTableColumn<Row>[] = [
  { name: 'pos', label: '#',    field: 'pos',         align: 'right', style: 'width:48px' },
  { name: 'team',label: 'Equipo',field: 'teamName',    align: 'left' },
  { name: 'pts', label: 'PTS',  field: 'points',      align: 'right' },
  { name: 'pj',  label: 'PJ',   field: 'played',      align: 'right' },
  { name: 'pg',  label: 'PG',   field: 'won',         align: 'right' },
  { name: 'pe',  label: 'PE',   field: 'draw',        align: 'right' },
  { name: 'pp',  label: 'PP',   field: 'lost',        align: 'right' },
  { name: 'gf',  label: 'GF',   field: 'goalsFor',    align: 'right' },
  { name: 'gc',  label: 'GC',   field: 'goalsAgainst',align: 'right' },
  { name: 'dg',  label: 'DG',   field: 'goalDiff',    align: 'right' }
]
</script>
