<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 560px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">{{ isEdit ? 'Editar equipo' : 'Nuevo equipo' }}</div>
        <q-space /><q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <TeamForm
          :tournament-id="tournamentId"
          :model-value="formModel || {}"
          @save="saveTeam"
          @cancel="() => (model = false)"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TeamForm from '@/components/tournaments/TeamForm.vue'
import { useTeamStore } from '@/stores/teams'
import type { Team } from '@/types/auth'

const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  modelValue2?: Partial<Team> | null
}>()
const emit = defineEmits<{
  (e:'update:modelValue', v:boolean): void
  (e:'saved'): void
}>()

const store = useTeamStore()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})
const formModel = computed(() => props.modelValue2 ?? null)
const isEdit = computed(() => !!formModel.value?.id)

async function saveTeam(payload: Omit<Team, 'id' | 'createdAt' | 'createdBy'>) {
  try {
    if (isEdit.value && formModel.value?.id) {
      await store.update(formModel.value.id, payload)
    } else {
      // Add createdBy property here; replace 'CURRENT_USER_ID' as appropriate
      await store.add({ ...payload, createdBy: 'CURRENT_USER_ID' })
    }
    emit('saved')
  } finally {
    model.value = false
  }
}
</script>
