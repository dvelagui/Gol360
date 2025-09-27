<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 300px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">{{ isEdit ? 'Editar equipo' : 'Nuevo equipo' }}</div>
        <q-space />
        <q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <TeamForm
          :tournament-id="tournamentId"
          v-bind="modelValue2 ? { modelValue: modelValue2 } : {}"
          @save="onSave"
          @cancel="() => model = false"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Notify } from 'quasar'
import TeamForm from '@/components/tournaments/forms/TeamForm.vue'
import { useTeamStore } from '@/stores/teams'
import type { Team } from '@/types/auth'

const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  modelValue2: Partial<Team> | null
}>()

const emit = defineEmits<{
  (e:'update:modelValue', v:boolean): void
  (e:'saved'): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const isEdit = computed(() => !!props.modelValue2?.id)
const store = useTeamStore()

type TeamFormPayload = Omit<Team, 'id' | 'createdAt' | 'createdBy'> & {
  __storagePath__?: string
  photoURL?: string | null
  crestUrl?: string | null
  captainId?: string | null
}

async function onSave(payload: TeamFormPayload) {
  try {
    if (isEdit.value && props.modelValue2?.id) {
      // UPDATE
      await store.update(props.modelValue2.id, {
        displayName: payload.displayName,
        city: payload.city,
        group: payload.group,
        colors: payload.colors ?? '',
        photoURL: payload.photoURL,
        crestUrl: payload.crestUrl,
        captainId: payload.captainId ?? ''
      } as Partial<Team>)
      Notify.create({ type: 'positive', message: 'Equipo actualizado' })
    } else {
      // CREATE
      const id = await store.add({
        tournamentId: payload.tournamentId,
        displayName: payload.displayName,
        city: payload.city,
        group: payload.group ?? '',
        colors: payload.colors ?? '',
        photoURL: payload.photoURL,
        crestUrl: payload.crestUrl,
        captainId: payload.captainId ?? '',
        createdBy: ''
      } as Omit<Team,'id'|'createdAt'>)
      if (id) Notify.create({ type: 'positive', message: 'Equipo creado' })
    }

    emit('saved')
    model.value = false
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo guardar el equipo' })
  }
}
</script>
