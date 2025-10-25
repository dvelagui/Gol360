
<template>
  <div class="match-form-container">
    <q-form @submit.prevent="onSave" class="q-gutter-lg">


      <div class="form-section">
        <div class="section-header">
          <q-icon name="sports_soccer" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-subtitle2 text-primary text-weight-bold">Equipos</span>
        </div>

        <!-- Warning if no teams available -->
        <div v-if="teamOptions.length === 0" class="q-mt-sm q-mb-md">
          <q-banner class="bg-warning text-white" dense rounded>
            <template #avatar>
              <q-icon name="warning" />
            </template>
            <div class="text-weight-bold">No hay equipos disponibles</div>
            <div class="text-caption">Debes crear equipos en el torneo antes de poder programar partidos.</div>
          </q-banner>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.homeTeamId"
              :options="teamOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              label="Equipo Local"
              :rules="[val => !!val || 'Selecciona el equipo local']"
              :disable="teamOptions.length === 0"
              filled
              dense
            >
              <template #prepend>
                <q-icon name="home" color="green" />
              </template>
              <template v-if="teamOptions.length === 0" #no-option>
                <q-item>
                  <q-item-section class="text-grey-6">
                    No hay equipos disponibles
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.awayTeamId"
              :options="teamOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              label="Equipo Visitante"
              :rules="[val => !!val || 'Selecciona el equipo visitante', val => val !== form.homeTeamId || 'Los equipos deben ser diferentes']"
              :disable="teamOptions.length === 0"
              filled
              dense
            >
              <template #prepend>
                <q-icon name="flight_takeoff" color="orange" />
              </template>
              <template v-if="teamOptions.length === 0" #no-option>
                <q-item>
                  <q-item-section class="text-grey-6">
                    No hay equipos disponibles
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <div v-if="form.homeTeamId && form.homeTeamId === form.awayTeamId" class="q-mt-sm">
          <q-banner class="bg-negative text-white" dense>
            <template #avatar>
              <q-icon name="warning" />
            </template>
            Los equipos local y visitante deben ser diferentes
          </q-banner>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <q-icon name="schedule" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-subtitle2 text-primary text-weight-bold">Programación</span>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.dateISO"
              type="datetime-local"
              label="Fecha y hora"
              :rules="[val => !!val || 'Selecciona fecha y hora', validateFutureDate]"
              filled
              dense
            >
              <template #prepend>
                <q-icon name="event" color="blue" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.round"
              :options="roundOptions"
              label="Jornada/Fecha"
              :rules="[val => !!val || 'Selecciona la jornada']"
              filled
              dense
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              new-value-mode="add-unique"
              @filter="filterRounds"
            >
              <template #prepend>
                <q-icon name="format_list_numbered" color="purple" />
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-6">
                    <div class="text-caption">Escribe para crear una nueva jornada</div>
                    <div class="text-caption text-primary">Ej: Fecha 1, Fecha 2, etc.</div>
                  </q-item-section>
                </q-item>
              </template>
              <template #hint>
                Selecciona una fecha existente o escribe una nueva
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.phase"
              :options="phaseOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Fase del torneo"
              filled
              dense
            >
              <template #prepend>
                <q-icon name="emoji_events" color="gold" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.field"
              label="Cancha"
              filled
              dense
              placeholder="ej: Cancha 1, Estadio Central"
            >
              <template #prepend>
                <q-icon name="stadium" color="green" />
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <q-expansion-item
        icon="settings"
        label="Detalles adicionales (opcional)"
        class="bg-grey-1 rounded-borders"
        header-style="padding: 16px"
      >
        <div class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="form.referee"
                label="Árbitro"
                filled
                dense
                placeholder="Nombre del árbitro principal"
              >
                <template #prepend>
                  <q-icon name="person" color="grey-6" />
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="form.notes"
                label="Notas"
                type="textarea"
                autogrow
                filled
                dense
                placeholder="Información adicional sobre el partido..."
              >
                <template #prepend>
                  <q-icon name="note" color="grey-6" />
                </template>
              </q-input>
            </div>
          </div>
        </div>
      </q-expansion-item>

      <div v-if="validationErrors.length > 0" class="q-mt-md">
        <q-banner class="bg-negative text-white" dense>
          <template #avatar>
            <q-icon name="error" />
          </template>
          <div class="text-weight-bold q-mb-xs">Corrige los siguientes errores:</div>
          <ul class="q-ma-none q-pl-md">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </q-banner>
      </div>

      <div class="row justify-end q-gutter-sm q-mt-lg">
        <q-btn
          flat
          label="Cancelar"
          color="grey-7"
          @click="$emit('cancel')"
          class="q-px-lg"
        />
        <q-btn
          :disable="!canSave"
          label="Guardar"
          color="primary"
          type="submit"
          class="q-px-lg"
          :loading="saving"
        >
          <template #loading>
            <q-spinner-hourglass class="on-left" />
            Guardando...
          </template>
        </q-btn>
      </div>

    </q-form>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MatchPhase } from '@/types/competition'

interface MatchFormData {
  tournamentId: string
  round: string
  phase: MatchPhase
  dateISO: string
  field?: string
  referee?: string
  homeTeamId: string
  awayTeamId: string
  notes?: string
}

const props = defineProps<{
  modelValue?: MatchFormData
  tournamentId: string
  teams: { id: string; name: string }[]
  editId?: string
  existingRounds?: string[] // Rounds that already exist in the tournament
}>()
const emit = defineEmits<{
  (e: 'save', payload: MatchFormData): void
  (e: 'cancel'): void
}>()

// Normalizar opciones de equipos para evitar problemas de IDs vs nombres
const teamOptions = computed(() => {
  const options = props.teams.map(team => ({
    id: team.id,
    name: team.name
  }))
  console.log('[MatchForm] Team options:', options.length, options)
  return options
})

// Generate default round options (Fecha 1 - Fecha 20)
const defaultRoundOptions = Array.from({ length: 20 }, (_, i) => `Fecha ${i + 1}`)

// Combine existing rounds with default options
const allRoundOptions = ref<string[]>([
  ...new Set([
    ...(props.existingRounds || []),
    ...defaultRoundOptions
  ])
].sort((a, b) => {
  // Sort by number if both start with "Fecha"
  const aMatch = a.match(/Fecha\s+(\d+)/)
  const bMatch = b.match(/Fecha\s+(\d+)/)
  if (aMatch?.[1] && bMatch?.[1]) {
    return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10)
  }
  return a.localeCompare(b)
}))

// Filtered round options for search
const roundOptions = ref<string[]>([...allRoundOptions.value])

// Filter function for round search
function filterRounds(val: string, update: (cb: () => void) => void) {
  update(() => {
    if (val === '') {
      roundOptions.value = [...allRoundOptions.value]
    } else {
      const needle = val.toLowerCase()
      roundOptions.value = allRoundOptions.value.filter(
        v => v.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

// Opciones de fase con labels mejorados
const phaseOptions = computed(() => [
  { label: '🏁 Fase Regular', value: 'grupos' },
  { label: '⚡ Eliminatoria', value: 'eliminatoria' },
  { label: '🥉 Semifinal', value: 'semifinal' },
  { label: '🏆 Final', value: 'final' }
])

const form = ref({
  tournamentId: props.tournamentId,
  round: '',
  phase: 'grupos' as MatchPhase,
  dateISO: '',
  field: '',
  referee: '',
  homeTeamId: '',
  awayTeamId: '',
  notes: ''
})

const saving = ref(false)

// si es edición, precargar (opcional)
if (props.modelValue) Object.assign(form.value, props.modelValue)

// Validación mejorada
const validateFutureDate = (val: string) => {
  if (!val) return true // La validación requerida se maneja separadamente
  const selectedDate = new Date(val)
  const now = new Date()
  return selectedDate > now || 'La fecha debe ser futura'
}

const validationErrors = computed(() => {
  const errors: string[] = []

  if (!form.value.homeTeamId || !form.value.awayTeamId) {
    errors.push('Selecciona ambos equipos')
  }

  if (form.value.homeTeamId === form.value.awayTeamId) {
    errors.push('Los equipos deben ser diferentes')
  }

  if (!form.value.dateISO) {
    errors.push('Selecciona fecha y hora')
  } else {
    const selectedDate = new Date(form.value.dateISO)
    if (selectedDate <= new Date()) {
      errors.push('La fecha debe ser futura')
    }
  }

  if (!form.value.round) {
    errors.push('Ingresa la jornada o fecha')
  }

  return errors
})

const canSave = computed(() => validationErrors.value.length === 0)

function onSave() {
  if (!canSave.value) return

  saving.value = true
  try {
    emit('save', { ...form.value })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.match-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.rounded-borders {
  border-radius: 12px;
}

.text-weight-bold {
  font-weight: 900 !important;
}

// Mejoras responsive
@media (max-width: 600px) {
  .match-form-container {
    max-width: 100%;
  }

  .form-section {
    padding: 12px;
    margin-bottom: 16px;
  }

  .section-header {
    margin-bottom: 12px;
  }

  .q-field {
    margin-bottom: 12px;
  }

  .q-btn {
    width: 100%;
    margin-bottom: 8px;
  }

  .row.justify-end {
    flex-direction: column-reverse;

    .q-btn:last-child {
      margin-bottom: 8px;
    }
  }
}

// Mejoras visuales
.q-expansion-item {
  border: 1px solid rgba(0, 0, 0, 0.12);

  :deep(.q-expansion-item__container) {
    .q-expansion-item__header {
      font-weight: 500;
      color: var(--q-primary);
    }
  }
}

.q-banner {
  border-radius: 8px;

  ul {
    list-style-type: disc;
  }
}

// Estados de los campos
.q-field {
  :deep(.q-field__control) {
    &:hover {
      .q-field__native {
        color: var(--q-primary);
      }
    }
  }
}

// Animaciones suaves
.form-section {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>


