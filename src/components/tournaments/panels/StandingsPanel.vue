<template>
  <div class="standings-panel">
    <div class="panel-header">
      <div class="header-content">
        <q-icon name="emoji_events" size="28px" color="primary" class="q-mr-sm" />
        <div class="text-h6 text-weight-bold">Tabla de Posiciones</div>
      </div>
      <q-btn-toggle
        v-model="viewMode"
        toggle-color="primary"
        rounded
        unelevated
        :options="[
          {label: $q.screen.gt.xs ? 'Tabla' : '', value:'table', icon: 'table_chart'},
          {label: $q.screen.gt.xs ? 'Tarjetas' : '', value:'cards', icon: 'view_module'}
        ]"
        class="view-toggle"
      />
    </div>

    <div v-if="store.loading" class="loading-state">
      <q-spinner-dots color="primary" size="48px" />
      <div class="text-body2 text-grey-7 q-mt-md">Cargando posiciones...</div>
    </div>

    <template v-else>
      <!-- Tabs de grupos si hay equipos con grupos definidos -->
      <q-tabs
        v-if="hasGroups"
        v-model="selectedGroup"
        dense
        class="text-grey-8 q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab
          v-for="group in availableGroups"
          :key="group.value"
          :name="group.value"
          :label="group.label"
          :icon="group.icon"
        />
      </q-tabs>

      <!-- Contenido según grupo seleccionado -->
      <StandingsTable
        v-if="viewMode === 'table'"
        :rows="filteredRows"
      />
      <StandingsCards
        v-else
        :rows="filteredRows"
      />

      <div v-if="!filteredRows.length" class="empty-state">
        <q-icon name="sports_score" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Sin posiciones aún</div>
        <div class="text-caption text-grey-5">
          {{ hasGroups ? `No hay equipos en ${selectedGroupLabel}` : 'La tabla de posiciones aparecerá cuando se confirmen resultados de partidos' }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useStandingStore } from '@/stores/standings'
import { listTeamsByTournament } from '@/services/teamService'

// ⚠️ Usa el mismo casing que ya existe en tu proyecto (Standings con S mayúscula)
const StandingsTable = defineAsyncComponent(() =>
  import('@/components/tournaments/cards/StandingsTable.vue')
)
const StandingsCards = defineAsyncComponent(() =>
  import('@/components/tournaments/cards/StandingsCards.vue')
)

const props = defineProps<{ tournamentId: string }>()
const store = useStandingStore()
const $q = useQuasar()

/** Toggle: 'table' | 'cards' - Auto detecta según tamaño de pantalla */
const viewMode = ref<'table' | 'cards'>($q.screen.gt.sm ? 'table' : 'cards')

/** Grupo seleccionado */
const selectedGroup = ref<string>('all')

/** Diccionario de equipo para mostrar nombre/logo en filas */
type TeamView = { id: string; name: string; crestUrl: string | null; group?: string }
const teamsMap = ref<Record<string, TeamView>>({})

onMounted(async () => {
  await Promise.all([store.fetch(props.tournamentId), loadTeams()])
})

async function loadTeams () {
  const list = await listTeamsByTournament(props.tournamentId)
  teamsMap.value = Object.fromEntries(
    list.map(t => [t.id, { id: t.id, name: t.displayName, crestUrl: t.crestUrl ?? null, group: t.group }])
  ) as Record<string, TeamView>
}

/** Detectar si hay equipos con grupos definidos */
const hasGroups = computed(() => {
  return Object.values(teamsMap.value).some(t => t.group)
})

/** Grupos disponibles dinámicamente */
const availableGroups = computed(() => {
  const groups = new Set<string>()
  Object.values(teamsMap.value).forEach(t => {
    if (t.group) groups.add(t.group)
  })

  const result = [{ label: 'Todos', value: 'all', icon: 'groups' }]

  // Ordenar grupos alfabéticamente
  const sortedGroups = Array.from(groups).sort()
  sortedGroups.forEach(g => {
    result.push({
      label: `Grupo ${g}`,
      value: g,
      icon: 'military_tech'
    })
  })

  return result
})

/** Label del grupo seleccionado */
const selectedGroupLabel = computed(() => {
  const group = availableGroups.value.find(g => g.value === selectedGroup.value)
  return group?.label || 'Todos'
})

/** Enriquecemos filas con nombre/logo + posición (pos) */
const rowsView = computed(() => {
  return store.table.map((r, idx) => {
    const tv = teamsMap.value[r.teamId]
    const baseRow = {
      ...r,
      teamName: tv?.name ?? 'Equipo',
      crestUrl: tv?.crestUrl ?? null,
      pos: idx + 1
    }
    // Solo agregar group si tiene valor para evitar undefined con exactOptionalPropertyTypes
    if (tv?.group) {
      return { ...baseRow, group: tv.group }
    }
    return baseRow
  })
})

/** Filas filtradas por grupo seleccionado */
const filteredRows = computed(() => {
  if (selectedGroup.value === 'all') {
    return rowsView.value
  }

  // Filtrar por grupo y recalcular posiciones
  const filtered = rowsView.value.filter(r => r.group === selectedGroup.value)
  return filtered.map((r, idx) => ({
    ...r,
    pos: idx + 1
  }))
})

// expone por si el padre quiere refrescar
defineExpose({ refetch: () => store.fetch(props.tournamentId) })
</script>

<style scoped lang="scss">
.standings-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E0E0E0;
}

.header-content {
  display: flex;
  align-items: center;
}

.view-toggle {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

:deep(.q-tabs) {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;

  .q-tab {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &--active {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

@media (max-width: 600px) {
  .standings-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .panel-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .header-content .text-h6 {
    font-size: 1.1rem;
  }

  :deep(.q-tabs) {
    .q-tab {
      min-height: 40px;
      padding: 8px 12px;
    }
  }
}
</style>
