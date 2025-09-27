<template>
  <q-dialog v-model="model">
    <q-card style="min-width: 420px; max-width: 95vw;">
      <q-card-section class="bg-primary text-white row items-center justify-between">
        <div class="text-subtitle1">Registrar Manager</div>
        <q-btn dense round flat icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input v-model="form.fullName" label="Nombre completo" :rules="[req]" dense filled />

        <q-input v-model="form.email" type="email" label="Email" :rules="[req, emailRule]" dense filled />

        <q-select
          v-model="form.docType"
          :options="docTypes"
          label="Tipo de documento"
          emit-value map-options
          :rules="[req]"
          dense filled
        />

        <q-input v-model="form.docNumber" type="text" label="Número de documento" :rules="[req]" dense filled />

        <q-input v-model="form.organization" label="Cancha u organización" dense filled />

        <q-input v-model="form.phone" type="tel" label="Teléfono de contacto" dense filled />

        <q-banner class="bg-grey-2 text-grey-8 q-mt-sm">
          La cuenta se creará con contraseña <b>123456</b>. El usuario podrá cambiarla al iniciar sesión.
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn :loading="loading" color="primary" label="Guardar" @click="onSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { Notify } from 'quasar'
import { createManagerWithAccount } from '@/services/accountService'
import { req, emailRule } from '@/utils/formValidators'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', payload: { id: string; label: string; value: string }): void
}>()

const model = ref(props.modelValue)
watch(() => props.modelValue, v => (model.value = v))
watch(model, v => emit('update:modelValue', v))

const docTypes = [
  { label: 'Cédula de Ciudadanía (CC)', value: 'CC' },
  { label: 'Tarjeta de Identidad (TI)', value: 'TI' },
  { label: 'Tarjeta de Extranjería (TE)', value: 'TE' }
]

const form = reactive({
  fullName: '',
  email: '',
  docType: 'CC' as 'CC'| 'TI' | 'TE',
  docNumber: '',
  organization: '',
  phone: ''
})

const loading = ref(false)

async function onSave () {
  if (!form.fullName || !form.email || !form.docType || !form.docNumber) return
  loading.value = true
  try {
    const id = await createManagerWithAccount({
      fullName: form.fullName,
      email: form.email,
      docType: form.docType,
      docNumber: form.docNumber,
      organization: form.organization,
      phone: form.phone
    })
    Notify.create({ type: 'positive', message: 'Manager creado' })
    // envía opción lista para select (label/value)
    emit('created', { id, label: form.fullName, value: id })
    model.value = false
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo crear el manager'
    Notify.create({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}
</script>
