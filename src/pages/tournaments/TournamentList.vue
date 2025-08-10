<!-- src/pages/tournaments/TournamentList.vue -->
<template>
  <q-page class="q-pa-lg">
    <div class="row q-col-gutter-md">
      <div class="col-12 flex justify-between items-center q-mb-md">
        <div class="text-h5">Torneos</div>
        <q-btn color="primary" label="Nuevo torneo" v-if="canCreate" @click="showForm=true" />
      </div>

      <div class="col-12 row q-col-gutter-md">
        <div v-for="t in store.items" :key="t.id" class="col-12 col-sm-6 col-md-4">
          <TournamentCard :t="t" @open="goDetail" />
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
import { canCreateTournament } from '@/utils/roles'
import { useRouter } from 'vue-router'

const showForm = ref(false)
const store = useTournamentStore()
const userStore = useUserStore()
const router = useRouter()

const canCreate = computed(() => canCreateTournament((userStore.user as any)?.role))

onMounted(() => store.fetch()) // Admin ve todo; Organizer luego podemos filtrar por organizerId

function goDetail(id: string) { router.push(`/tournaments/${id}`) }

async function create(payload: any) {
  await store.add({ ...payload, createdBy: userStore.user?.uid || '' } as any)
  showForm.value = false
}
</script>
