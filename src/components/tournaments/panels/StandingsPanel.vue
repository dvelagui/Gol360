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
      <StandingsTable
        v-if="viewMode === 'table'"
        :rows="rowsView"
      />
      <StandingsCards
        v-else
        :rows="rowsView"
      />

      <div v-if="!rowsView.length" class="empty-state">
        <q-icon name="sports_score" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Sin posiciones aún</div>
        <div class="text-caption text-grey-5">
          La tabla de posiciones aparecerá cuando se confirmen resultados de partidos
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

/** Diccionario de equipo para mostrar nombre/logo en filas */
type TeamView = { id: string; name: string; crestUrl: string | null }
const teamsMap = ref<Record<string, TeamView>>({})

onMounted(async () => {
  await Promise.all([store.fetch(props.tournamentId), loadTeams()])
})

async function loadTeams () {
  const list = await listTeamsByTournament(props.tournamentId)
  teamsMap.value = Object.fromEntries(
    list.map(t => [t.id, { id: t.id, name: t.displayName, crestUrl: t.crestUrl ?? null }])
  ) as Record<string, TeamView>
}

/** Enriquecemos filas con nombre/logo + posición (pos) */
const rowsView = computed(() => {
  return store.table.map((r, idx) => {
    const tv = teamsMap.value[r.teamId]
    return {
      ...r,
      teamName: tv?.name ?? 'Equipo',
      crestUrl: tv?.crestUrl ?? null,
      pos: idx + 1
    }
  })
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
}
</style>
