<template>
  <q-page class="q-pa-lg">
    <!-- Header + Filtros -->
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <div class="text-h5">Torneos</div>
        <div class="text-caption text-grey-7">Gestiona y consulta torneos</div>
      </div>

      <div class="col-12 col-md-4">
        <q-input
          v-model="search"
          dense
          filled
          clearable
          placeholder="Buscar por nombre o ciudad…"
          :debounce="200"
          prefix-icon="search"
          :input-style="{ fontSize: '14px' }"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-6 col-md-2">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          dense
          filled
          clearable
          label="Estado"
          emit-value
          map-options
        />
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="typeFilter"
          :options="typeOptions"
          dense
          filled
          clearable
          label="Tipo de campeonato"
          emit-value
          map-options
        />
      </div>
    </div>

    <!-- Grid -->
    <div class="row q-col-gutter-lg">
      <!-- Card para CREAR torneo (solo si puede) -->
      <div v-if="canCreate" class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card
          class="add-card cursor-pointer column items-center justify-center q-pa-lg"
          @click="showForm = true"
        >
          <q-avatar size="72px" class="q-mb-md" color="primary" text-color="white">
            <q-icon name="add" size="md" />
          </q-avatar>
          <div class="text-subtitle1 text-primary">Nuevo torneo</div>
          <div class="text-caption text-grey-7">Crea un torneo y asigna un manager</div>
        </q-card>
      </div>

      <!-- Tarjetas de torneos -->
      <div
        v-for="t in filtered"
        :key="t.tournamentId"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TournamentCard
          :t="t"
          @click="goDetail(t.tournamentId)"
        />
      </div>

      <!-- Vacío -->
      <div
        v-if="!filtered.length"
        class="col-12 text-grey-6 q-mt-xl flex flex-center"
      >
        <div class="text-subtitle1">No se encontraron torneos con los filtros aplicados.</div>
      </div>
    </div>

    <!-- Dialog de creación -->
    <q-dialog v-model="showForm" persistent>
      <q-card class="q-pa-md" style="min-width: 420px; max-width: 95vw;">
        <TournamentForm @submit="create" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import TournamentCard from '@/components/tournaments/TournamentCard.vue'
import TournamentForm from '@/components/tournaments/TournamentForm.vue'
import { useTournamentStore } from '@/stores/tournaments'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'
import type { AppRole } from '@/utils/roles'
import { canCreateTournament } from '@/utils/roles'

type Status = 'scheduled' | 'in_progress' | 'finished'
type TType = '' | 'league' | 'league_playoff' | 'playoff'

const store = useTournamentStore()
const userStore = useUserStore()
const database = useDatabaseStore()
const router = useRouter()

const showForm = ref(false)
const search = ref('')
const statusFilter = ref<Status | null>(null)
const typeFilter = ref<TType | null>(null)

const statusOptions = [
  { label: 'Programado', value: 'scheduled' },
  { label: 'En curso',   value: 'in_progress' },
  { label: 'Finalizado', value: 'finished' }
] as const

const typeOptions = [
  { label: 'Todos contra todos', value: 'league' },
  { label: 'Todos + eliminatoria', value: 'league_playoff' },
  { label: 'Eliminatoria', value: 'playoff' }
] as const

const role = computed(() => database.userData?.role)
const canCreate = computed(() => canCreateTournament(role.value as AppRole))

async function fetchByRole () {
  if (!role.value) return
  // admin ve todos; manager solo los suyos
  if (role.value === 'manager') {
    await store.fetch(userStore.user?.uid || '')
  } else {
    await store.fetch()
  }
}

onMounted(fetchByRole)
watch(role, fetchByRole)

const filtered = computed(() => {
  const text = search.value.trim().toLowerCase()
  return store.items
    .filter(t => {
      const matchesText =
        !text ||
        t.displayName?.toLowerCase().includes(text) ||
        t.city?.toLowerCase().includes(text)

      const matchesStatus = !statusFilter.value || t.status === statusFilter.value
      const matchesType   = !typeFilter.value   || t.type === typeFilter.value

      return matchesText && matchesStatus && matchesType
    })
    .map(t => ({
      ...t,
      status: t.status as Status
    }))
})

function goDetail(id: string) {
  void router.push(`/tournaments/${id}`)
}

async function create(payload: Record<string, unknown>) {
  // el TournamentForm ya nos da todos los campos validados
  const tournamentData = {
    tournamentId: (payload.id as string) || '',
    displayName: payload.displayName as string,
    city: payload.city as string,
    type: payload.type as TType,
    startDate: payload.startDate as string,
    managerId: payload.managerId as string,
    managerName: payload.managerName as string || '',
    createdBy: userStore.user?.uid || '',
    numTeams: payload.numTeams as number,
    // status lo manejas manual por ahora; no lo seteo aquí
    season: (payload.season as string) ?? '',
    category: (payload.category as string) ?? '',
    rulesUrl: (payload.rulesUrl as string) ?? '',
    description: (payload.description as string) ?? '',
    status: 'scheduled',
    photoURL: ''
  }
  await store.add(tournamentData)
  showForm.value = false
}
</script>

<style scoped lang="scss">
.add-card {
  border: 2px dashed var(--q-primary);
  border-radius: 16px;
  transition: transform .12s ease, box-shadow .12s ease;
  background: #fff;
}
.add-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,.08);
}
</style>
