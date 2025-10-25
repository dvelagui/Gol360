# Profile Page - Documentación de Implementación

**Fecha:** 2025-10-24
**Feature:** Página de perfil de usuario
**Archivo:** `src/pages/profile/ProfilePage.vue`

---

## 📋 Resumen

Se ha implementado una página completa de perfil de usuario que permite a todos los roles (admin, manager, team, player) gestionar su información personal, subir foto de perfil y editar campos específicos según su rol.

---

## ✅ Características Implementadas

### 1. **Sección de Foto de Perfil**

#### Funcionalidades:
- ✅ Visualización de avatar actual (foto o iniciales)
- ✅ Botón flotante para cambiar foto
- ✅ Upload de imagen con validaciones:
  - Solo archivos de imagen (`image/*`)
  - Tamaño máximo: 5MB
- ✅ Preview en tiempo real antes de guardar
- ✅ Barra de progreso durante la subida
- ✅ Integración con Firebase Storage

#### Storage Path:
```
profiles/{userId}/{timestamp}_filename.ext
```

#### Proceso de Upload:
1. Usuario selecciona imagen
2. Validación de tipo y tamaño
3. Preview local (FileReader)
4. Upload a Firebase Storage con progress tracking
5. Obtención de download URL
6. Actualización de `photoURL` en el formulario

---

### 2. **Formulario de Datos Personales**

#### Campos Comunes (todos los roles):

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| **Nombre completo** | Text | ✅ Sí | `displayName` |
| **Email** | Email | N/A | Solo lectura, no editable |
| **Teléfono** | Tel | ❌ No | Opcional |
| **Biografía** | Textarea | ❌ No | Máx 500 caracteres |

#### Campos Específicos para Jugadores (`role: 'player'`):

| Campo | Tipo | Requerido | Validación | Descripción |
|-------|------|-----------|------------|-------------|
| **Dorsal** | Number | ❌ No | 0-99 | `jerseyNumber` |
| **Posición** | Select | ❌ No | - | Ver opciones abajo |
| **Altura** | Number | ❌ No | - | En centímetros |
| **Peso** | Number | ❌ No | - | En kilogramos |
| **Pie preferido** | Select | ❌ No | - | Derecho/Izquierdo/Ambos |

#### Opciones de Posición:
```typescript
- Portero (goalkeeper)
- Defensa Central (center-back)
- Lateral Derecho (right-back)
- Lateral Izquierdo (left-back)
- Pivote (defensive-midfielder)
- Mediocentro (central-midfielder)
- Mediapunta (attacking-midfielder)
- Extremo Derecho (right-winger)
- Extremo Izquierdo (left-winger)
- Delantero Centro (striker)
```

#### Opciones de Pie Preferido:
```typescript
- Derecho (right)
- Izquierdo (left)
- Ambos (both)
```

---

### 3. **Integración con Firebase**

#### Firestore - Actualización de Datos

**Path:** `users/{documentId}`

**Campos actualizados:**
```typescript
{
  displayName: string,
  photoURL: string,
  updatedAt: Date,

  // Solo para jugadores:
  jerseyNumber?: number,
  position?: string,
  height?: number,
  weight?: number,
  preferredFoot?: string,

  // Comunes opcionales:
  phone?: string,
  bio?: string
}
```

**Método de actualización:**
```typescript
const userDocRef = doc(db, 'users', userData.__docId__)
await updateDoc(userDocRef, updateData)
```

#### Firebase Storage - Subida de Fotos

**Bucket:** Default Storage bucket
**Path:** `profiles/{userId}/{filename}`

**Proceso:**
1. Create storage reference con `storageRef()`
2. Upload con `uploadBytesResumable()` para tracking de progreso
3. Get download URL con `getDownloadURL()`
4. Actualizar Firestore con nueva URL

---

### 4. **Rutas Implementadas**

Se crearon 4 rutas, una por cada rol:

```typescript
// Admin
{
  path: '/admin/profile',
  name: 'profile-admin',
  component: ProfilePage,
  meta: { requiresAuth: true, requiresRole: 'admin' }
}

// Manager
{
  path: '/manager/profile',
  name: 'profile-manager',
  component: ProfilePage,
  meta: { requiresAuth: true, requiresRole: 'manager' }
}

// Team
{
  path: '/team/profile',
  name: 'profile-team',
  component: ProfilePage,
  meta: { requiresAuth: true, requiresRole: 'team' }
}

// Player
{
  path: '/player/profile',
  name: 'profile-player',
  component: ProfilePage,
  meta: { requiresAuth: true, requiresRole: 'player' }
}
```

---

### 5. **Navegación en Sidebar**

#### EssentialLink Component

**Avatar clicable** (líneas 11-27):
- Muestra foto o iniciales
- Hover muestra overlay "Editar"
- Click navega a perfil según rol

**Menú de navegación** (línea 88):
- Opción "Perfil" con icono `account_circle`
- Disponible para todos los roles
- Navega a `/{role}/profile`

**Función actualizada:**
```typescript
function goToProfile() {
  const rolePrefix = `/${role.value}`;
  void router.push(`${rolePrefix}/profile`)
}
```

---

## 🎨 Diseño y UX

### Layout Responsivo

#### Desktop (≥768px):
```
┌─────────────────────────────────┐
│  Header (Gradient verde)       │
├──────────┬──────────────────────┤
│  Photo   │   Form               │
│  Card    │   - Nombre           │
│  350px   │   - Email            │
│          │   - Campos rol       │
│          │   - Acciones         │
└──────────┴──────────────────────┘
```

#### Mobile (<768px):
```
┌─────────────────────────────────┐
│  Header                         │
├─────────────────────────────────┤
│  Photo Card                     │
│  (full width)                   │
├─────────────────────────────────┤
│  Form Card                      │
│  (full width)                   │
└─────────────────────────────────┘
```

### Colores por Rol

```scss
admin:   red
manager: orange
team:    blue
player:  green
```

Aplicados en:
- Chip de rol
- Avatar border (verde para todos)

### Animaciones y Feedback

- ✅ Loading spinner durante carga inicial
- ✅ Progress bar durante upload de foto
- ✅ Preview instantáneo de imagen seleccionada
- ✅ Botones con estados de loading
- ✅ Notificaciones toast:
  - ✅ Éxito al subir foto
  - ✅ Éxito al guardar perfil
  - ❌ Errores de validación
  - ❌ Errores de red/Firebase

---

## 🔧 Funciones Principales

### `loadUserData()`
Carga datos del usuario desde `databaseStore` al formulario.

```typescript
function loadUserData() {
  if (!userData.value) return

  form.value = {
    displayName: userData.value.displayName || '',
    email: userData.value.email || '',
    photoURL: userData.value.photoURL || '',
    // ... campos específicos de jugador
  }
}
```

### `onFileSelected(event)`
Maneja selección de archivo de imagen.

**Validaciones:**
- Tipo: `image/*`
- Tamaño: ≤ 5MB

**Acciones:**
- Preview con FileReader
- Llamada a `uploadPhoto()`

### `uploadPhoto(file)`
Sube imagen a Firebase Storage con tracking de progreso.

**Estados:**
- `uploadingPhoto: boolean`
- `uploadProgress: number` (0-1)

**Path:** `profiles/{userId}/{timestamp}_filename.ext`

### `saveProfile()`
Guarda cambios en Firestore.

**Proceso:**
1. Validar usuario autenticado
2. Preparar objeto `updateData`
3. Incluir campos específicos si `role === 'player'`
4. `updateDoc()` en Firestore
5. Refrescar datos con `fetchUserData()`
6. Notificar éxito

### `resetForm()`
Descarta cambios y recarga datos originales.

---

## 📁 Archivos Modificados

```
Gol-360-App/
├── src/
│   ├── pages/
│   │   └── profile/
│   │       └── ProfilePage.vue          ✨ NUEVO
│   │
│   ├── router/
│   │   └── routes.ts                    📝 MODIFICADO
│   │
│   └── layouts/
│       └── EssentialLink.vue            📝 MODIFICADO
│
└── docs/
    └── PROFILE_PAGE_IMPLEMENTATION.md   📄 NUEVO
```

---

## 🧪 Testing Checklist

### Funcionalidad Básica
- [ ] Página carga correctamente para admin
- [ ] Página carga correctamente para manager
- [ ] Página carga correctamente para team
- [ ] Página carga correctamente para player
- [ ] Avatar muestra foto si existe
- [ ] Avatar muestra iniciales si no hay foto
- [ ] Formulario se pre-llena con datos actuales

### Upload de Foto
- [ ] Botón de cámara abre selector de archivo
- [ ] Validación rechaza archivos no-imagen
- [ ] Validación rechaza archivos >5MB
- [ ] Preview muestra imagen seleccionada
- [ ] Progress bar muestra durante upload
- [ ] URL de foto se actualiza en formulario
- [ ] Notificación de éxito aparece

### Edición de Datos
- [ ] Nombre se puede editar
- [ ] Email está deshabilitado
- [ ] Campos de jugador solo aparecen si role=player
- [ ] Validación de dorsal (0-99) funciona
- [ ] Selects de posición y pie funcionan
- [ ] Teléfono y bio son opcionales
- [ ] Bio tiene límite de 500 caracteres
- [ ] Contador de caracteres funciona

### Guardado
- [ ] Botón "Guardar" está deshabilitado durante guardado
- [ ] Loading spinner aparece en botón
- [ ] Datos se actualizan en Firestore
- [ ] Datos se refrescan en la UI
- [ ] Notificación de éxito aparece
- [ ] Avatar en sidebar se actualiza

### Navegación
- [ ] Clic en avatar navega a perfil
- [ ] Overlay "Editar" aparece en hover
- [ ] Opción "Perfil" en menú funciona
- [ ] Rutas usan prefijo de rol correcto
- [ ] Guards de autenticación funcionan

### Responsive
- [ ] Layout desktop (2 columnas) funciona
- [ ] Layout mobile (1 columna) funciona
- [ ] Botones en mobile ocupan full width
- [ ] Header se adapta a móvil

### Errores
- [ ] Error de red muestra notificación
- [ ] Error de permisos muestra notificación
- [ ] Usuario no autenticado es redirigido
- [ ] Formulario inválido no se envía

---

## 🚀 Próximas Mejoras (Opcional)

### Funcionalidades Adicionales

1. **Cambio de contraseña**
   - Formulario para actualizar password
   - Validación de contraseña actual
   - Confirmación de nueva contraseña

2. **Verificación de email**
   - Botón para reenviar email de verificación
   - Badge si email no verificado

3. **Eliminación de cuenta**
   - Opción para eliminar cuenta
   - Confirmación con dialog
   - Eliminación de datos de Firestore y Storage

4. **Recorte de imagen**
   - Editor de imagen antes de subir
   - Ajuste de zoom y posición
   - Crop circular para avatar

5. **Campos adicionales para jugadores**
   - Fecha de nacimiento
   - Nacionalidad
   - Historial de equipos
   - Estadísticas personales

6. **Galería de fotos**
   - Múltiples fotos del jugador
   - Carrusel o grid
   - Selección de foto principal

7. **Integración con redes sociales**
   - Links a perfiles sociales
   - Compartir perfil

8. **Preferencias de notificaciones**
   - Toggle para emails
   - Toggle para notificaciones push
   - Frecuencia de notificaciones

### Mejoras de UI/UX

- Skeleton loaders durante carga
- Animaciones de transición entre estados
- Drag & drop para foto de perfil
- Vista previa de cómo se ve el perfil para otros
- Modo oscuro
- Indicador de completitud de perfil (%)

---

## 📞 Notas para el Equipo

### Consideraciones de Seguridad

1. **Storage Rules**: ✅ **IMPLEMENTADO** - Solo el usuario puede subir/modificar sus propias fotos
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /profiles/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null
                      && request.auth.uid == userId
                      && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                      && request.resource.contentType.matches('image/.*'); // Only images
       }
     }
   }
   ```
   **Desplegado con:** `firebase deploy --only storage`

2. **Firestore Rules**: Validar que solo el usuario pueda actualizar su propio documento
   ```
   match /users/{userId} {
     allow read: if request.auth != null;
     allow update: if request.auth != null && request.auth.uid == resource.data.uid;
   }
   ```

3. **Validación de datos**: Implementar Cloud Functions para validar datos antes de escribir

### Campos Faltantes en Firestore

Si alguno de estos campos no existe en el documento de usuario, agregar en la creación inicial:
- `jerseyNumber`
- `position`
- `height`
- `weight`
- `preferredFoot`
- `phone`
- `bio`

### Performance

- Considerar compresión de imágenes antes de subir (librería como `browser-image-compression`)
- Implementar caché de imágenes en CDN
- Lazy loading de campos no críticos

---

**Última actualización:** 2025-10-24
**Estado:** ✅ Completado y listo para testing
**Autor:** Claude Code AI Assistant
