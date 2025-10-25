<template>
  <div v-if="showInstallButton" class="install-pwa-container">
    <q-btn
      :icon="icon"
      :label="label"
      :color="color"
      :flat="flat"
      :outline="outline"
      :rounded="rounded"
      :unelevated="unelevated"
      :size="size"
      :dense="dense"
      @click="installPWA"
      class="install-pwa-btn"
    >
      <q-tooltip v-if="showTooltip" :delay="500">
        Instala GOL360 en tu dispositivo
      </q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

// Props para personalización
interface Props {
  label?: string
  icon?: string
  color?: string
  flat?: boolean
  outline?: boolean
  rounded?: boolean
  unelevated?: boolean
  size?: string
  dense?: boolean
  showTooltip?: boolean
}

withDefaults(defineProps<Props>(), {
  label: 'Instalar App',
  icon: 'install_mobile',
  color: 'primary',
  flat: false,
  outline: true,
  rounded: false,
  unelevated: false,
  size: 'md',
  dense: false,
  showTooltip: true
})

const $q = useQuasar()

// Estado
const showInstallButton = ref(false)
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

// Tipo personalizado para el evento
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Detectar si la PWA ya está instalada
function isPWAInstalled(): boolean {
  interface NavigatorWithStandalone extends Navigator {
    standalone?: boolean
  }

  // Verifica si está en modo standalone (instalada)
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as NavigatorWithStandalone).standalone === true || // iOS
         document.referrer.includes('android-app://') // Android
}

// Manejar el evento beforeinstallprompt
function handleBeforeInstallPrompt(e: Event) {
  console.log('[PWA Install] beforeinstallprompt event fired')

  // Prevenir que Chrome muestre su prompt automáticamente
  e.preventDefault()

  // Guardar el evento para usarlo después
  deferredPrompt.value = e as BeforeInstallPromptEvent

  // Mostrar nuestro botón de instalación
  showInstallButton.value = true
}

// Instalar la PWA
async function installPWA() {
  // Si no hay prompt nativo disponible, mostrar instrucciones manuales
  if (!deferredPrompt.value) {
    console.log('[PWA Install] No deferred prompt available - showing manual instructions')

    // Detectar el navegador para dar instrucciones específicas
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)

    let message = 'Para instalar GOL360:'
    let caption = ''

    if (isIOS) {
      message = 'Instalar en iOS'
      caption = '1. Toca el botón "Compartir" ⎙\n2. Selecciona "Agregar a pantalla de inicio"'
    } else if (isChrome) {
      message = 'Instalar en Chrome'
      caption = '1. Toca el menú ⋮ (arriba a la derecha)\n2. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"'
    } else if (isSafari) {
      message = 'Instalar en Safari'
      caption = 'Toca el botón "Compartir" y selecciona "Agregar a pantalla de inicio"'
    } else {
      message = 'Instalar GOL360'
      caption = 'Busca la opción "Instalar aplicación" en el menú de tu navegador'
    }

    $q.dialog({
      title: message,
      message: caption,
      persistent: false,
      ok: {
        label: 'Entendido',
        color: 'primary',
        flat: true
      }
    })

    return
  }

  console.log('[PWA Install] Showing install prompt')

  // Mostrar el prompt de instalación
  await deferredPrompt.value.prompt()

  // Esperar a que el usuario responda
  const { outcome } = await deferredPrompt.value.userChoice

  console.log(`[PWA Install] User response: ${outcome}`)

  if (outcome === 'accepted') {
    $q.notify({
      type: 'positive',
      message: '¡GOL360 se está instalando!',
      caption: 'Encontrarás el icono en tu pantalla de inicio',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    })
  } else {
    $q.notify({
      type: 'info',
      message: 'Instalación cancelada',
      caption: 'Puedes instalar la app más tarde desde el menú',
      icon: 'info',
      position: 'top',
      timeout: 2000
    })
  }

  // Limpiar el prompt usado
  deferredPrompt.value = null
  showInstallButton.value = false
}

// Manejar cuando la app se instala
function handleAppInstalled() {
  console.log('[PWA Install] App installed successfully')

  $q.notify({
    type: 'positive',
    message: '¡GOL360 instalada correctamente!',
    icon: 'download_done',
    position: 'top',
    timeout: 2500
  })

  // Ocultar el botón
  showInstallButton.value = false
  deferredPrompt.value = null
}

// Lifecycle
onMounted(() => {
  console.log('[PWA Install] Component mounted')

  // Verificar estado de instalación
  const isInstalled = isPWAInstalled()
  console.log('[PWA Install] Is PWA installed?', isInstalled)

  // No mostrar el botón si ya está instalada
  if (isInstalled) {
    console.log('[PWA Install] App already installed - hiding button')
    showInstallButton.value = false
    return
  }

  // Mostrar el botón siempre si no está instalada
  showInstallButton.value = true
  console.log('[PWA Install] Install button shown (showInstallButton =', showInstallButton.value, ')')

  // Escuchar el evento de instalación
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  console.log('[PWA Install] Listeners registered')
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<style scoped lang="scss">
.install-pwa-container {
  display: inline-block;
}

.install-pwa-btn {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}
</style>
