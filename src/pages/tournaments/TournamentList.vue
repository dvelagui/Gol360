<template>
  <q-page class="q-pa-lg">
    <div class="row q-col-gutter-md">
      <div class="col-12 flex justify-between items-center q-mb-md">
        <div class="text-h5">Torneos</div>
        <q-btn color="primary" label="Nuevo torneo" v-if="canCreate" @click="showForm=true" />
      </div>

      <div class="col-12 row q-col-gutter-md">
        <div v-for="t in store.items" :key="t.tournamentId" class="col-12 col-sm-6 col-md-4">
          <TournamentCard :t="t" @click="goDetail(t.tournamentId)" />
        </div>
      </div>
    </div>

    <q-dialog v-model="showForm">
      <q-card class="q-pa-md">
        <TournamentForm @submit="create" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TournamentCard from '@/components/tournaments/TournamentCard.vue'
import TournamentForm from '@/components/tournaments/TournamentForm.vue'
import { useTournamentStore } from '@/stores/tournaments'
import { useUserStore } from '@/stores/user'
import { useDatabaseStore } from '@/stores/database'
import type { AppRole } from '@/utils/roles'
import { canCreateTournament } from '@/utils/roles'
import { useRouter } from 'vue-router' // Adjust the path if AppRole is defined elsewhere

const showForm = ref(false)
const store = useTournamentStore()
const userStore = useUserStore()
const databaseStore = useDatabaseStore()
const router = useRouter()

const canCreate = computed(() => canCreateTournament(databaseStore.userData?.role as AppRole))

onMounted(async () => {
  await store.fetch();

})

function goDetail(id: string) {
  void router.push(`/tournaments/${id}`)
}

async function create(payload: Record<string, unknown>) {
  // Ensure all required fields are present in the payload
  const tournamentData = {
    tournamentId: payload.id as string || '',
    displayName: payload.displayName as string,
    city: payload.city as string,
    type: payload.type as string,
    startDate: payload.startDate as string,
    managerId: payload.managerId as string,
    createdBy: userStore.user?.uid || '',
    numTeams: payload.numTeams as number // Ensure numTeams is provided by the form
  }
  await store.add(tournamentData)
  showForm.value = false
}
</script>
