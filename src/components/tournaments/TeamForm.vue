<template>
  <q-form @submit.prevent="onSave" class="q-gutter-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-input v-model="form.displayName" label="Nombre del equipo" dense filled />
      </div>
      <div class="col-12 col-sm-6">
        <q-input v-model="form.city" label="Ciudad" dense filled />
      </div>
      <div class="col-12 col-sm-6">
        <q-input v-model="form.group" label="Grupo (opcional)" dense filled />
      </div>
      <div class="col-12 col-sm-6">
        <q-input v-model="colorsString" label="Colores (opcional, ej: azul, blanco)" dense filled />
      </div>
      <div class="col-12">
        <q-input v-model="form.crestUrl" label="URL del escudo (opcional)" dense filled />
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
import type { Team } from '@/types/auth'

const props = defineProps<{
  tournamentId: string
  modelValue?: Partial<Team>
}>()

const emit = defineEmits<{
  (e: 'save', payload: Omit<Team,'id'|'createdAt'|'createdBy'>): void
  (e: 'cancel'): void
}>()

const form = ref<Omit<Team,'id'|'createdAt'|'createdBy'>>({
  tournamentId: props.tournamentId,
  displayName: props.modelValue?.displayName ?? '',
  city: props.modelValue?.city ?? "",
  group: props.modelValue?.group ?? "",
  colors: props.modelValue?.colors ?? { primary: "", secondary: "" },
  crestUrl: props.modelValue?.crestUrl ?? "",
  captainId: props.modelValue?.captainId ?? ""
})

// Computed property to handle colors as a string for the input
const colorsString = computed({
  get() {
    const colors = form.value.colors || { primary: "", secondary: "" }
    // Join primary and secondary with comma if both exist
    return [colors.primary, colors.secondary].filter(Boolean).join(', ')
  },
  set(val: string) {
    const [primary = "", secondary = ""] = val.split(',').map(s => s.trim())
    form.value.colors = { primary, secondary }
  }
})

const canSave = computed(() => form.value.tournamentId && form.value.displayName.trim().length > 0)

function onSave() { if (canSave.value) emit('save', { ...form.value }) }
</script>
