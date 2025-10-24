<template>
  <q-dialog v-model="model" persistent transition-show="slide-up" transition-hide="slide-down" maximized>
    <q-card class="team-dialog-card">
      <div class="dialog-header">
        <div class="header-overlay">
          <div class="row items-center full-width">
            <q-icon :name="isEdit ? 'edit' : 'group_add'" size="32px" class="text-white q-mr-md" />
            <div class="header-text">
              <div class="text-h5 text-white text-weight-bold">
                {{ isEdit ? 'Editar Equipo' : 'Nuevo Equipo' }}
              </div>
              <div class="text-caption text-white text-weight-regular subtitle-text">
                {{ isEdit ? 'Actualiza la información del equipo' : 'Completa los datos para registrar el equipo' }}
              </div>
            </div>
            <q-space />
            <q-btn
              dense
              round
              flat
              icon="close"
              color="white"
              size="md"
              v-close-popup
            >
              <q-tooltip>Cerrar</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <q-card-section class="dialog-content">
        <div class="form-container">
          <TeamForm
            :tournament-id="tournamentId"
            v-bind="modelValue2 ? { modelValue: modelValue2 } : {}"
            @save="onSave"
            @cancel="() => model = false"
          />
        </div>
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

<style scoped lang="scss">
.team-dialog-card {
  width: 100%;
  max-width: 700px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}

.dialog-header {
  position: relative;
  background: linear-gradient(135deg, #064F34, #138A59);
  padding: 24px;
  overflow: hidden;
  flex-shrink: 0;
}

.header-overlay {
  position: relative;
  z-index: 1;
  background: radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, .12), transparent 50%);
}

.header-text {
  flex: 1;
  min-width: 0;
}

.subtitle-text {
  opacity: 0.9;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 24px !important;
}

.form-container {
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 1023px) {
  .team-dialog-card {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }

  .dialog-header {
    padding: 16px;
  }

  .dialog-content {
    padding: 16px !important;
  }

  .text-h5 {
    font-size: 1.25rem !important;
  }

  .subtitle-text {
    font-size: 0.75rem;
    display: -webkit-box;
    line-clamp: 1;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

@media (min-width: 1024px) {
  .team-dialog-card {
    border-radius: 16px;
  }
}
</style>
