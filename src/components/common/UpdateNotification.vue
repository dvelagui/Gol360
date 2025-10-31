<template>
  <q-banner
    v-if="showUpdateBanner"
    class="update-banner bg-primary text-white"
    dense
  >
    <template #avatar>
      <q-icon name="system_update" size="32px" />
    </template>

    <div class="banner-content">
      <div class="text-weight-bold">¡Nueva versión disponible!</div>
      <div class="text-caption">Actualiza para disfrutar de las últimas mejoras</div>
    </div>

    <template #action>
      <q-btn
        flat
        color="white"
        label="Actualizar"
        @click="updateApp"
        :loading="updating"
      />
      <q-btn
        flat
        dense
        icon="close"
        @click="dismissUpdate"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showUpdateBanner = ref(false)
const updating = ref(false)
let registration: ServiceWorkerRegistration | null = null
let refreshing = false

// Detectar cuando hay un nuevo service worker esperando
function onNewServiceWorker(reg: ServiceWorkerRegistration) {
  registration = reg
  showUpdateBanner.value = true
}

// Actualizar la app
function updateApp() {
  if (!registration || !registration.waiting) return

  updating.value = true

  // Enviar mensaje al service worker para que se active inmediatamente
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })

  // Esperar a que se active el nuevo service worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

// Descartar el banner temporalmente
function dismissUpdate() {
  showUpdateBanner.value = false

  // Volver a mostrar el banner en 1 hora
  setTimeout(() => {
    if (registration?.waiting) {
      showUpdateBanner.value = true
    }
  }, 60 * 60 * 1000) // 1 hora
}

// Detectar nuevo service worker
function listenForUpdates() {
  if (!navigator.serviceWorker) return

  void navigator.serviceWorker.ready.then((reg) => {
    // Verificar si ya hay un service worker esperando
    if (reg.waiting) {
      onNewServiceWorker(reg)
    }

    // Escuchar cambios de estado
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nuevo service worker instalado y hay uno activo
          onNewServiceWorker(reg)
        }
      })
    })
  })

  // Verificar actualizaciones cada 30 segundos
  const intervalId = setInterval(() => {
    void navigator.serviceWorker.ready.then((reg) => {
      void reg.update()
    })
  }, 30 * 1000) // 30 segundos

  // Limpiar intervalo cuando el componente se destruya
  onUnmounted(() => {
    clearInterval(intervalId)
  })
}

onMounted(() => {
  // Solo ejecutar en PWA (cuando hay service worker)
  if ('serviceWorker' in navigator) {
    listenForUpdates()
  }
})
</script>

<style scoped lang="scss">
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.banner-content {
  flex: 1;
}

@media (max-width: 600px) {
  .update-banner {
    :deep(.q-banner__content) {
      flex-direction: column;
      gap: 12px;
    }

    :deep(.q-banner__actions) {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
