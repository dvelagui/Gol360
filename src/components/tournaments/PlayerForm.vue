<template>
  <q-form @submit.prevent="onSave" class="q-gutter-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-input v-model="form.displayName" label="Nombre del jugador" dense filled />
      </div>
      <div class="col-12 col-sm-6">
        <q-input v-model="form.position" label="Posición (opcional)" dense filled />
      </div>
      <div class="col-12 col-sm-6">
        <q-input v-model.number="form.jersey" type="number" label="Dorsal (opcional)" dense filled />
      </div>
      <div class="col-12 col-sm-6">
      <q-select
          v-model="form.role"
          :options="roleOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          label="Rol en el equipo"
          dense
          filled
        />
      </div>
    </div>

    <div class="row justify-end q-gutter-sm">
      <q-btn flat label="Cancelar" color="grey-7" @click="$emit('cancel')" />
      <q-btn :disable="!canSave" label="Guardar" color="primary" type="submit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Player } from '@/types/auth'

const props = defineProps<{
  tournamentId: string
  teamId: string
  modelValue?: Partial<Player>
}>()

const emit = defineEmits<{
  (e: 'save', payload: Omit<Player,'id'|'createdAt'|'createdBy'>): void
  (e: 'cancel'): void
}>()

const roleOptions: Array<{ label: string; value: Player['role'] }> = [
  { label: 'Jugador',  value: 'player' },
  { label: 'Capitán',  value: 'team' }
]

const form = ref<Omit<Player,'id'|'createdAt'|'createdBy'>>({
  tournamentId: props.tournamentId,
  teamId: props.teamId,
  displayName: props.modelValue?.displayName ?? '',
  position: props.modelValue?.position ?? '',
  jersey: props.modelValue?.jersey ?? 0,
  role: props.modelValue?.role ?? 'player',
  active: props.modelValue?.active ?? true
})

const canSave = computed(() =>
  form.value.tournamentId && form.value.teamId &&
  form.value.displayName.trim().length > 0
)

function onSave() { if (canSave.value) emit('save', { ...form.value }) }
</script>
