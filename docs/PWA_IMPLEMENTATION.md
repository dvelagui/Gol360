# PWA (Progressive Web App) - Documentación de Implementación

**Fecha:** 2025-10-24
**Feature:** Instalación de PWA con botón personalizado
**Estado:** ✅ Completado y listo para uso

---

## 📋 Resumen

Se ha implementado soporte completo de PWA (Progressive Web App) en GOL360, permitiendo a los usuarios instalar la aplicación en sus dispositivos móviles y de escritorio como si fuera una app nativa.

---

## ✅ Características Implementadas

### 1. **Configuración PWA Completa**

#### Archivos PWA Creados:

```
src-pwa/
├── manifest.json                # Configuración de la app
├── register-service-worker.ts   # Registro del Service Worker
└── custom-service-worker.ts     # Service Worker personalizado (para modo InjectManifest)
```

#### Configuración en `quasar.config.ts`:

- ✅ Modo PWA: `GenerateSW` (genera Service Worker automáticamente)
- ✅ Cache Strategy para Firebase Storage: `CacheFirst` (30 días)
- ✅ Cache Strategy para Firestore: `NetworkFirst` (1 hora)
- ✅ Cleanup de cachés antiguos automático
- ✅ Meta tags PWA inyectados automáticamente
- ✅ Skip waiting y clients claim habilitados

**Cache Strategies:**

```typescript
// Firebase Storage - CacheFirst (imágenes, fotos de perfil)
- Expiration: 30 días
- Max Entries: 50 archivos
- Statuses cacheables: 0, 200

// Firestore API - NetworkFirst (datos en tiempo real)
- Network timeout: 10 segundos
- Expiration: 1 hora
- Max Entries: 50 requests
```

---

### 2. **Manifest PWA (`manifest.json`)**

**Configuración:**

```json
{
  "name": "GOL360",
  "short_name": "GOL360",
  "description": "Plataforma de análisis deportivo y streaming en vivo",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "categories": ["sports", "entertainment"]
}
```

**Iconos requeridos:**
- ✅ 128x128px
- ✅ 192x192px (mínimo Android)
- ✅ 256x256px
- ✅ 384x384px
- ✅ 512x512px (recomendado Android)

**⚠️ NOTA IMPORTANTE:** Los iconos actuales son placeholders (copias del 128x128). Se recomienda generar iconos optimizados en cada tamaño.

---

### 3. **Componente de Instalación (`InstallPWA.vue`)**

**Ubicación:** `src/components/common/InstallPWA.vue`

#### Funcionalidades:

- ✅ Detecta si la app ya está instalada
- ✅ Escucha el evento `beforeinstallprompt`
- ✅ Muestra botón solo cuando la instalación está disponible
- ✅ Maneja el prompt de instalación del navegador
- ✅ Notificaciones de éxito/cancelación
- ✅ Oculta automáticamente el botón después de instalar
- ✅ Responsive (diferentes vistas para mobile/desktop)

#### Props Disponibles:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | String | 'Instalar App' | Texto del botón |
| `icon` | String | 'install_mobile' | Icono del botón |
| `color` | String | 'primary' | Color del botón |
| `flat` | Boolean | false | Estilo plano |
| `outline` | Boolean | true | Estilo outline |
| `rounded` | Boolean | false | Bordes redondeados |
| `unelevated` | Boolean | false | Sin elevación |
| `size` | String | 'md' | Tamaño del botón |
| `dense` | Boolean | false | Tamaño compacto |
| `showTooltip` | Boolean | true | Mostrar tooltip |

#### Ejemplo de Uso:

```vue
<!-- Botón simple -->
<InstallPWA />

<!-- Botón personalizado -->
<InstallPWA
  label="Descargar App"
  icon="download"
  color="green"
  rounded
  unelevated
/>

<!-- Botón solo icono (mobile) -->
<InstallPWA
  icon="install_mobile"
  label=""
  dense
  flat
/>
```

---

### 4. **Integración en MainLayout**

**Ubicación:** `src/layouts/MainLayout.vue`

El botón de instalación se agregó en el header, junto al botón de logout:

```vue
<div v-if="isLoggedIn" class="row items-center q-gutter-sm">
  <!-- Desktop: con tooltip -->
  <InstallPWA
    icon="install_mobile"
    label=""
    dense
    flat
    :show-tooltip="true"
    class="gt-sm"
  />

  <!-- Mobile: sin tooltip -->
  <InstallPWA
    icon="install_mobile"
    label=""
    dense
    flat
    :show-tooltip="false"
    class="lt-md"
  />

  <q-btn dense flat round icon="info" label="Info" @click="handleLogout" />
</div>
```

---

## 🔧 Cómo Funciona

### 1. **Detección de Disponibilidad**

El componente `InstallPWA` detecta automáticamente:

- ✅ Si el navegador soporta instalación PWA
- ✅ Si la app ya está instalada
- ✅ Si el usuario está en HTTPS (requerido)
- ✅ Si cumple los criterios de instalación

**Criterios de instalación:**
- Manifest.json válido
- Service Worker registrado
- Servido sobre HTTPS
- Usuario ha interactuado con el sitio

### 2. **Evento `beforeinstallprompt`**

```typescript
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // Prevenir prompt automático del navegador
  deferredPrompt = e // Guardar para uso posterior
  showButton = true  // Mostrar nuestro botón personalizado
})
```

### 3. **Instalación**

Cuando el usuario hace clic en el botón:

1. Se llama a `deferredPrompt.prompt()`
2. El navegador muestra su diálogo nativo
3. Se espera la respuesta del usuario
4. Se muestra notificación de éxito/cancelación
5. Se oculta el botón

### 4. **Estados de la App**

```
┌─────────────────────────────────────┐
│  Usuario entra al sitio (HTTPS)    │
└──────────────┬──────────────────────┘
               │
               ▼
    ¿Ya está instalada?
               │
       ┌───────┴───────┐
       │               │
      SÍ              NO
       │               │
       ▼               ▼
  Ocultar botón   Mostrar botón
                       │
                       ▼
                  Usuario hace clic
                       │
                       ▼
               Prompt del navegador
                       │
              ┌────────┴────────┐
              │                 │
         Acepta            Cancela
              │                 │
              ▼                 ▼
        Instala app      Oculta prompt
              │
              ▼
      Ocultar botón
```

---

## 🚀 Uso y Comandos

### Desarrollo

**Modo SPA (normal):**
```bash
quasar dev
```

**Modo PWA (con Service Worker):**
```bash
quasar dev -m pwa
```

⚠️ **IMPORTANTE:** El Service Worker solo funciona en producción o en `localhost`. No funciona en IPs locales (ej: 192.168.x.x).

### Build de Producción

**Build SPA:**
```bash
quasar build
# Output: dist/spa/
```

**Build PWA:**
```bash
quasar build -m pwa
# Output: dist/pwa/
```

### Deploy a Firebase

#### Opción 1: Deploy SPA (como antes)
```bash
quasar build
firebase deploy --only hosting
```

#### Opción 2: Deploy PWA (recomendado)

1. **Actualizar `firebase.json`:**
```json
{
  "hosting": {
    "public": "dist/pwa",  // Cambiar de "dist/spa" a "dist/pwa"
    ...
  }
}
```

2. **Build y deploy:**
```bash
quasar build -m pwa
firebase deploy --only hosting
```

---

## 📱 Pruebas

### Testing Local (Desarrollo)

1. **Iniciar en modo PWA:**
```bash
quasar dev -m pwa
```

2. **Abrir Chrome DevTools:**
   - Application tab
   - Service Workers (verificar que esté activo)
   - Manifest (verificar configuración)

3. **Simular instalación:**
   - En Chrome: DevTools > Application > Manifest > "Add to home screen"

### Testing en Dispositivo Real

#### Android:

1. **Deploy a Firebase Hosting:**
```bash
quasar build -m pwa
firebase deploy --only hosting
```

2. **Acceder desde Chrome en Android:**
   - Ir a la URL de producción
   - Chrome mostrará banner de instalación automático
   - O usar el botón "Instalar App" en el header

3. **Verificar instalación:**
   - Buscar icono "GOL360" en pantalla de inicio
   - Abrir app (debe abrir en pantalla completa, sin barra de navegador)
   - Verificar que funciona offline (modo avión)

#### iOS (Safari):

⚠️ **LIMITACIÓN:** iOS no soporta el evento `beforeinstallprompt`, por lo que nuestro botón **NO aparecerá** en Safari.

**Instalación manual en iOS:**
1. Abrir sitio en Safari
2. Tap en botón "Compartir" (ícono de cuadro con flecha)
3. Scroll y tap en "Agregar a pantalla de inicio"
4. Confirmar nombre y tap "Agregar"

**Nota:** Se puede agregar un banner informativo para usuarios iOS explicando cómo instalar manualmente.

---

## 🎨 Personalización

### Cambiar colores del tema

Editar `quasar.config.ts`:

```typescript
pwa: {
  extendManifestJson (json) {
    json.theme_color = '#ff0000'        // Color de la barra de estado
    json.background_color = '#ffffff'   // Color de splash screen
  }
}
```

### Agregar splash screen personalizado

Crear iconos con `maskable` para Android:

```json
{
  "icons": [
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Cambiar estrategia de caché

Editar `quasar.config.ts`:

```typescript
extendGenerateSWOptions (cfg) {
  cfg.runtimeCaching = [
    {
      urlPattern: /tu-api\.com/,
      handler: 'NetworkFirst', // Opciones: CacheFirst, NetworkFirst, NetworkOnly, CacheOnly
      options: {
        cacheName: 'mi-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 días
        }
      }
    }
  ]
}
```

---

## 🐛 Troubleshooting

### El botón de instalación no aparece

**Posibles causas:**

1. **La app ya está instalada**
   - Solución: Desinstalar y recargar

2. **No estás en HTTPS**
   - Solución: Usar Firebase Hosting o localhost

3. **Service Worker no registrado**
   - Verificar: Chrome DevTools > Application > Service Workers
   - Solución: Hacer hard refresh (Ctrl+Shift+R)

4. **Navegador no soporta PWA**
   - iOS Safari no dispara `beforeinstallprompt`
   - Solución: Instrucciones manuales para iOS

### Service Worker no se actualiza

**Problema:** Cambios en el código no se reflejan en la app instalada

**Solución:**

1. **Forzar actualización del SW:**
```typescript
// En register-service-worker.ts
updated(registration) {
  // Forzar activación inmediata
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
  window.location.reload()
}
```

2. **Limpiar caché:**
   - Chrome DevTools > Application > Clear storage > "Clear site data"

3. **Actualizar versión:**
   - Cambiar algo en el código y rebuild
   - Quasar genera nuevo hash del SW automáticamente

### App no funciona offline

**Verificar:**

1. **Service Worker activo:**
```bash
Chrome DevTools > Application > Service Workers > Status: "activated"
```

2. **Recursos en caché:**
```bash
Chrome DevTools > Application > Cache Storage
```

3. **Estrategia de caché correcta:**
   - Assets estáticos: `CacheFirst`
   - APIs dinámicas: `NetworkFirst` con fallback

---

## 📊 Métricas y Monitoreo

### Verificar instalaciones

**Google Analytics (futuro):**
```typescript
// En register-service-worker.ts
window.addEventListener('appinstalled', () => {
  // Track en GA
  gtag('event', 'app_installed', {
    event_category: 'PWA',
    event_label: 'Installation'
  })
})
```

### Verificar uso offline

```typescript
window.addEventListener('online', () => {
  console.log('App online')
})

window.addEventListener('offline', () => {
  console.log('App offline')
})
```

---

## 🔐 Seguridad

### HTTPS Requerido

- ✅ Firebase Hosting ya usa HTTPS
- ⚠️ No funciona en HTTP (excepto localhost)

### Service Worker Scope

El Service Worker controla todas las requests de tu dominio:

```
https://tu-app.web.app/
  ├── / (controlado)
  ├── /admin (controlado)
  ├── /profile (controlado)
  └── ...
```

### Actualización de contenido sensible

Para datos sensibles que NO deben cachearse:

```typescript
// quasar.config.ts
cfg.runtimeCaching = [
  {
    urlPattern: /\/api\/secure\/.*/,
    handler: 'NetworkOnly', // Nunca cachear
  }
]
```

---

## 📝 Mejoras Futuras

### 1. **Notificaciones Push**

```typescript
// Pedir permiso
const permission = await Notification.requestPermission()

if (permission === 'granted') {
  // Suscribir a FCM (Firebase Cloud Messaging)
}
```

### 2. **Background Sync**

Sincronizar datos cuando el usuario vuelva online:

```typescript
// Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-matches') {
    event.waitUntil(syncMatches())
  }
})
```

### 3. **Periodic Background Sync**

Actualizar datos en background cada X tiempo:

```typescript
const status = await navigator.permissions.query({
  name: 'periodic-background-sync'
})

if (status.state === 'granted') {
  await registration.periodicSync.register('update-scores', {
    minInterval: 60 * 1000 // 1 minuto
  })
}
```

### 4. **Share Target API**

Permitir compartir contenido hacia la app:

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 5. **Badging API**

Mostrar badge con número de notificaciones:

```typescript
navigator.setAppBadge(5) // Muestra "5" en el icono
navigator.clearAppBadge() // Quita el badge
```

### 6. **Banner para iOS**

Agregar componente que detecte iOS y muestre instrucciones:

```vue
<q-banner v-if="isIOS && !isInstalled" class="bg-info">
  Para instalar: tap en <q-icon name="ios_share" /> y luego "Agregar a pantalla de inicio"
</q-banner>
```

---

## 📞 Checklist de Testing

### Pre-Deploy

- [ ] Build PWA sin errores (`quasar build -m pwa`)
- [ ] Manifest válido (Chrome DevTools)
- [ ] Service Worker registrado
- [ ] Todos los iconos existen (128, 192, 256, 384, 512)
- [ ] Meta tags PWA inyectados
- [ ] Cache strategies configuradas

### Post-Deploy

- [ ] Botón de instalación aparece en desktop
- [ ] Botón de instalación aparece en Android
- [ ] Click en botón muestra prompt nativo
- [ ] App se instala correctamente
- [ ] Icono aparece en pantalla de inicio
- [ ] App abre en modo standalone (sin barra de navegador)
- [ ] App funciona offline (modo avión)
- [ ] Recursos estáticos se cachean
- [ ] Notificaciones de actualización funcionan
- [ ] Desinstalar y reinstalar funciona

### iOS (Manual)

- [ ] Safari puede acceder al sitio
- [ ] "Agregar a pantalla de inicio" funciona
- [ ] App abre en modo standalone
- [ ] Iconos se muestran correctamente

---

## 🎯 Resumen de Archivos

```
Gol-360-App/
├── src-pwa/
│   ├── manifest.json                    ✨ NUEVO
│   ├── register-service-worker.ts       ✨ NUEVO
│   └── custom-service-worker.ts         ✨ NUEVO
│
├── src/
│   ├── components/
│   │   └── common/
│   │       └── InstallPWA.vue           ✨ NUEVO
│   │
│   └── layouts/
│       └── MainLayout.vue               📝 MODIFICADO
│
├── public/
│   └── icons/
│       ├── icon-128x128.png             ✨ NUEVO
│       ├── icon-192x192.png             ✨ NUEVO
│       ├── icon-256x256.png             ✨ NUEVO
│       ├── icon-384x384.png             ✨ NUEVO
│       └── icon-512x512.png             ✨ NUEVO
│
├── quasar.config.ts                     📝 MODIFICADO
├── firebase.json                        ⚠️ PENDIENTE (cambiar a dist/pwa)
│
└── docs/
    └── PWA_IMPLEMENTATION.md            📄 ESTE ARCHIVO
```

---

**Última actualización:** 2025-10-24
**Estado:** ✅ Implementación completa
**Próximo paso:** Generar iconos optimizados y desplegar en producción
**Autor:** Claude Code AI Assistant
