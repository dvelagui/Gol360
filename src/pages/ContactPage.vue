<template>
  <q-page class="contact-page">
    <div class="container q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-xl">
        <h1 class="text-h3 text-weight-bold text-primary q-mb-md">Contáctanos</h1>
        <p class="text-h6 text-grey-7">¿Tienes alguna pregunta? Estamos aquí para ayudarte</p>
      </div>

      <div class="row q-col-gutter-lg">
        <!-- Contact Information -->
        <div class="col-12 col-md-5">
          <q-card flat bordered class="contact-info-card">
            <q-card-section>
              <div class="text-h5 text-weight-bold q-mb-lg">
                <q-icon name="info" color="primary" size="28px" class="q-mr-sm" />
                Información de Contacto
              </div>

              <div class="contact-item q-mb-lg">
                <div class="contact-icon-wrapper">
                  <q-icon name="phone" color="positive" size="32px" />
                </div>
                <div>
                  <div class="text-subtitle2 text-grey-7">WhatsApp</div>
                  <a
                    :href="`https://wa.me/57${contactInfo.whatsapp}`"
                    target="_blank"
                    class="text-h6 text-weight-medium contact-link"
                  >
                    {{ formatPhoneNumber(contactInfo.whatsapp) }}
                  </a>
                </div>
              </div>

              <q-separator class="q-my-lg" />

              <div class="contact-item">
                <div class="contact-icon-wrapper">
                  <q-icon name="email" color="primary" size="32px" />
                </div>
                <div>
                  <div class="text-subtitle2 text-grey-7">Email</div>
                  <a
                    :href="`mailto:${contactInfo.email}`"
                    class="text-h6 text-weight-medium contact-link"
                  >
                    {{ contactInfo.email }}
                  </a>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Contact Form -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="contact-form-card">
            <q-card-section>
              <div class="text-h5 text-weight-bold q-mb-lg">
                <q-icon name="send" color="primary" size="28px" class="q-mr-sm" />
                Envíanos un Mensaje
              </div>

              <q-form @submit="onSubmit" class="q-gutter-md">
                <q-input
                  v-model="form.name"
                  label="Nombre completo *"
                  outlined
                  :rules="[val => !!val || 'El nombre es requerido']"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>

                <q-input
                  v-model="form.email"
                  label="Correo electrónico *"
                  type="email"
                  outlined
                  :rules="[
                    val => !!val || 'El email es requerido',
                    val => /.+@.+\..+/.test(val) || 'Email inválido'
                  ]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>

                <q-input
                  v-model="form.phone"
                  label="Teléfono"
                  outlined
                  mask="(###) ### ####"
                  unmasked-value
                >
                  <template #prepend>
                    <q-icon name="phone" />
                  </template>
                </q-input>

                <q-input
                  v-model="form.subject"
                  label="Asunto *"
                  outlined
                  :rules="[val => !!val || 'El asunto es requerido']"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="subject" />
                  </template>
                </q-input>

                <q-input
                  v-model="form.message"
                  label="Mensaje *"
                  type="textarea"
                  outlined
                  rows="6"
                  :rules="[val => !!val || 'El mensaje es requerido']"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="message" />
                  </template>
                </q-input>

                <div class="text-right">
                  <q-btn
                    type="submit"
                    color="primary"
                    label="Enviar Mensaje"
                    icon-right="send"
                    size="lg"
                    unelevated
                    :loading="loading"
                    :disable="loading"
                    class="q-px-xl"
                  />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import contactService from '@/services/contactService'

// Contact information
const contactInfo = {
  whatsapp: '3232064273',
  email: 'info@gol360.co'
}

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
})

const loading = ref(false)
const $q = useQuasar()

// Helper function to format phone number
function formatPhoneNumber(phone: string): string {
  return `+57 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
}

// Handle form submission
async function onSubmit() {
  loading.value = true

  try {
    const messageData = {
      name: form.value.name,
      email: form.value.email,
      subject: form.value.subject,
      message: form.value.message,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      ...(form.value.phone && form.value.phone.trim() !== '' ? { phone: form.value.phone } : {})
    }

    await contactService.createContactMessage(messageData)

    $q.notify({
      type: 'positive',
      message: '¡Mensaje enviado con éxito!',
      caption: 'Te responderemos lo antes posible',
      position: 'top',
      timeout: 3000
    })

    // Reset form
    form.value = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    }
  } catch (error) {
    console.error('Error sending message:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al enviar el mensaje',
      caption: 'Por favor intenta de nuevo',
      position: 'top',
      timeout: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.contact-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.contact-info-card,
.contact-form-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.contact-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 50%;
}

.contact-link {
  text-decoration: none;
  color: var(--q-primary);
  transition: color 0.3s ease;

  &:hover {
    color: var(--q-secondary);
    text-decoration: underline;
  }
}

@media (max-width: 600px) {
  .text-h3 {
    font-size: 2rem;
  }

  .text-h5 {
    font-size: 1.25rem;
  }

  .text-h6 {
    font-size: 1rem;
  }
}
</style>
