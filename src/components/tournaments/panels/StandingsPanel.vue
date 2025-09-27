<template>
  <div class="q-pa-md bg-grey-1 rounded-borders">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Tabla de posiciones</div>
      <q-space />
      <q-btn-toggle
        v-model="viewMode"
        toggle-color="primary"
        rounded
        dense
        unelevated
        :options="[
          {label:'Tabla', value:'table', icon: 'table_chart'},
          {label:'Tarjetas', value:'cards', icon: 'view_module'}
        ]"
      />
    </div>

    <q-banner
      v-if="store.loading"
      inline-actions
      class="bg-grey-2 text-grey-8 q-mb-md"
    >
      Cargando posiciones…
      <template #action>
        <q-spinner-dots color="primary" size="1.2em" />
      </template>
    </q-banner>

    <template v-else>
      <StandingsTable
        v-if="viewMode === 'table'"
        :rows="rowsView"
      />
      <StandingsCards
        v-else
        :rows="rowsView"
      />
      <div v-if="!rowsView.length" class="text-grey-6 q-mt-md">
        Aún no hay posiciones para este torneo.
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useStandingStore } from '@/stores/standings'
import { listTeamsByTournament } from '@/services/teamService'

// ⚠️ Usa el mismo casing que ya existe en tu proyecto (Standings con S mayúscula)
const StandingsTable = defineAsyncComponent(() =>
  import('@/components/tournaments/Standings/StandingsTable.vue')
)
const StandingsCards = defineAsyncComponent(() =>
  import('@/components/tournaments/Standings/StandingsCards.vue')
)

const props = defineProps<{ tournamentId: string }>()
const store = useStandingStore()

/** Toggle: 'table' | 'cards'  */
const viewMode = ref<'table' | 'cards'>('table')

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

<style scoped>
.rounded-borders{ border-radius: 12px; }
</style>
