<template>
  <q-page class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <div class="header-content">
          <q-icon name="person" size="32px" class="header-icon" />
          <div>
            <h1 class="text-h4 text-weight-bold q-mb-xs">Mi Perfil</h1>
            <p class="text-subtitle2 text-grey-7">Gestiona tu información personal</p>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <q-spinner-dots color="primary" size="50px" />
        <p class="text-grey-6">Cargando perfil...</p>
      </div>

      <div v-else class="profile-content">
        <q-card class="photo-card">
          <q-card-section class="text-center">
            <div class="photo-wrapper">
              <q-avatar size="150px" class="profile-avatar">
                <img v-if="photoPreview || form.photoURL" :src="photoPreview || form.photoURL" />
                <q-icon v-else name="person" size="80px" />
              </q-avatar>

              <q-btn
                round
                color="primary"
                icon="photo_camera"
                class="photo-upload-btn"
                @click="triggerFileInput"
              >
                <q-tooltip>Cambiar foto</q-tooltip>
              </q-btn>

              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                hidden
                @change="onFileSelected"
              />
            </div>

            <div class="q-mt-md">
              <div class="text-h6 text-weight-bold">{{ form.displayName || 'Sin nombre' }}</div>
              <div class="text-caption text-grey-7">{{ userData?.email }}</div>
              <q-chip
                :color="roleColor"
                text-color="white"
                size="sm"
                class="q-mt-sm"
              >
                {{ roleLabel }}
              </q-chip>
            </div>

            <q-linear-progress
              v-if="uploadingPhoto"
              :value="uploadProgress"
              color="primary"
              class="q-mt-md"
            />
            <p v-if="uploadingPhoto" class="text-caption text-grey-7 q-mt-xs">
              Subiendo foto... {{ Math.round(uploadProgress * 100) }}%
            </p>
          </q-card-section>
        </q-card>

        <q-card class="info-card">
          <q-card-section>
            <div class="section-header">
              <q-icon name="edit" size="24px" />
              <span class="text-h6 text-weight-bold">Información Personal</span>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-form @submit="saveProfile" class="profile-form">
              <div class="form-field">
                <label class="field-label">Nombre completo</label>
                <q-input
                  v-model="form.displayName"
                  outlined
                  placeholder="Ingresa tu nombre completo"
                  :rules="[val => !!val || 'El nombre es requerido']"
                >
                  <template #prepend>
                    <q-icon name="badge" />
                  </template>
                </q-input>
              </div>

              <div class="form-field">
                <label class="field-label">Correo electrónico</label>
                <q-input
                  v-model="form.email"
                  outlined
                  readonly
                  disable
                  type="email"
                >
                  <template #prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>
                <p class="field-hint">El correo no se puede modificar</p>
              </div>
              <template v-if="userData?.role === 'player'">
                <div class="form-field">
                  <label class="field-label">Número de dorsal</label>
                  <q-input
                    v-model.number="form.jerseyNumber"
                    outlined
                    type="number"
                    placeholder="Ej: 10"
                    :rules="[
                      val => val === null || val === undefined || val === '' || (val >= 0 && val <= 99) || 'Debe ser entre 0 y 99'
                    ]"
                  >
                    <template #prepend>
                      <q-icon name="sports_soccer" />
                    </template>
                  </q-input>
                </div>

                <div class="form-field">
                  <label class="field-label">Posición</label>
                  <q-select
                    v-model="form.position"
                    :options="positionOptions"
                    outlined
                    emit-value
                    map-options
                    placeholder="Selecciona tu posición"
                  >
                    <template #prepend>
                      <q-icon name="sports" />
                    </template>
                  </q-select>
                </div>

                <div class="form-field">
                  <label class="field-label">Altura - cm (opcional)</label>
                  <q-input
                    v-model.number="form.height"
                    outlined
                    type="number"
                    placeholder="Ej: 175"
                    suffix="cm"
                  >
                    <template #prepend>
                      <q-icon name="height" />
                    </template>
                  </q-input>
                </div>
                <div class="form-field">
                  <label class="field-label">Peso - kg (opcional)</label>
                  <q-input
                    v-model.number="form.weight"
                    outlined
                    type="number"
                    placeholder="Ej: 70"
                    suffix="kg"
                  >
                    <template #prepend>
                      <q-icon name="fitness_center" />
                    </template>
                  </q-input>
                </div>

                <div class="form-field">
                  <label class="field-label">Pie preferido (opcional)</label>
                  <q-select
                    v-model="form.preferredFoot"
                    :options="footOptions"
                    outlined
                    emit-value
                    map-options
                    placeholder="Selecciona tu pie preferido"
                  >
                    <template #prepend>
                      <q-icon name="directions_run" />
                    </template>
                  </q-select>
                </div>
              </template>

              <div class="form-field">
                <label class="field-label">Teléfono (opcional)</label>
                <q-input
                  v-model="form.phone"
                  outlined
                  type="tel"
                  placeholder="+57 300 123 4567"
                >
                  <template #prepend>
                    <q-icon name="phone" />
                  </template>
                </q-input>
              </div>

              <div class="form-field">
                <label class="field-label">Biografía (opcional)</label>
                <q-input
                  v-model="form.bio"
                  outlined
                  type="textarea"
                  rows="3"
                  placeholder="Cuéntanos sobre ti..."
                  maxlength="500"
                  counter
                >
                  <template #prepend>
                    <q-icon name="description" />
                  </template>
                </q-input>
              </div>

              <div class="form-actions">
                <q-btn
                  label="Cancelar"
                  outline
                  color="grey-7"
                  @click="resetForm"
                  :disable="saving"
                />
                <q-btn
                  type="submit"
                  label="Guardar cambios"
                  color="primary"
                  icon-right="save"
                  :loading="saving"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDatabaseStore } from '@/stores/database'
import { useUserStore } from '@/stores/user'
import { storage, db } from '@/boot/firebase'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'

// Extended user data interface for player-specific fields
interface ExtendedUserData {
  jerseyNumber?: number | null
  position?: string
  height?: number | null
  weight?: number | null
  preferredFoot?: string
  phone?: string
  bio?: string
}

// Stores
const databaseStore = useDatabaseStore()
const userStore = useUserStore()
const $q = useQuasar()

// State
const loading = ref(false)
const saving = ref(false)
const uploadingPhoto = ref(false)
const uploadProgress = ref(0)
const photoPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Form data
const form = ref({
  displayName: '',
  email: '',
  photoURL: '',
  jerseyNumber: null as number | null,
  position: '',
  height: null as number | null,
  weight: null as number | null,
  preferredFoot: '',
  phone: '',
  bio: ''
})

// Options
const positionOptions = [
  { label: 'Portero', value: 'goalkeeper' },
  { label: 'Defensa Central', value: 'center-back' },
  { label: 'Lateral Derecho', value: 'right-back' },
  { label: 'Lateral Izquierdo', value: 'left-back' },
  { label: 'Pivote', value: 'defensive-midfielder' },
  { label: 'Mediocentro', value: 'central-midfielder' },
  { label: 'Mediapunta', value: 'attacking-midfielder' },
  { label: 'Extremo Derecho', value: 'right-winger' },
  { label: 'Extremo Izquierdo', value: 'left-winger' },
  { label: 'Delantero Centro', value: 'striker' }
]

// Map English position values to Spanish labels for playerParticipations
const positionToSpanish: Record<string, string> = {
  'goalkeeper': 'Portero',
  'center-back': 'Defensa Central',
  'right-back': 'Lateral Derecho',
  'left-back': 'Lateral Izquierdo',
  'defensive-midfielder': 'Pivote',
  'central-midfielder': 'Mediocentro',
  'attacking-midfielder': 'Mediapunta',
  'right-winger': 'Extremo Derecho',
  'left-winger': 'Extremo Izquierdo',
  'striker': 'Delantero Centro'
}

const footOptions = [
  { label: 'Derecho', value: 'right' },
  { label: 'Izquierdo', value: 'left' },
  { label: 'Ambos', value: 'both' }
]

// Computed
const userData = computed(() => databaseStore.userData)

const roleColor = computed(() => {
  const role = userData.value?.role
  switch (role) {
    case 'admin': return 'red'
    case 'manager': return 'orange'
    case 'team': return 'blue'
    case 'player': return 'green'
    default: return 'grey'
  }
})

const roleLabel = computed(() => {
  const role = userData.value?.role
  switch (role) {
    case 'admin': return 'Administrador'
    case 'manager': return 'Manager'
    case 'team': return 'Equipo'
    case 'player': return 'Jugador'
    default: return 'Usuario'
  }
})

// Methods
function loadUserData() {
  if (!userData.value) return

  const extendedData = userData.value as typeof userData.value & ExtendedUserData

  form.value = {
    displayName: userData.value.displayName || '',
    email: userData.value.email || '',
    photoURL: userData.value.photoURL || '',
    jerseyNumber: extendedData.jerseyNumber || null,
    position: extendedData.position || '',
    height: extendedData.height || null,
    weight: extendedData.weight || null,
    preferredFoot: extendedData.preferredFoot || '',
    phone: extendedData.phone || '',
    bio: extendedData.bio || ''
  }
}

function resetForm() {
  loadUserData()
  photoPreview.value = null
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    $q.notify({
      type: 'warning',
      message: 'Por favor selecciona una imagen válida',
      position: 'top'
    })
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    $q.notify({
      type: 'warning',
      message: 'La imagen no debe superar los 5MB',
      position: 'top'
    })
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload to Firebase Storage
  uploadPhoto(file)
}

function uploadPhoto(file: File) {
  if (!userStore.user?.uid) return

  uploadingPhoto.value = true
  uploadProgress.value = 0

  try {
    // Create storage reference
    const fileName = `profile_${userStore.user.uid}_${Date.now()}.${file.name.split('.').pop()}`
    const photoRef = storageRef(storage, `profiles/${userStore.user.uid}/${fileName}`)

    // Upload with progress
    const uploadTask = uploadBytesResumable(photoRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        uploadProgress.value = snapshot.bytesTransferred / snapshot.totalBytes
      },
      (error) => {
        console.error('Upload error:', error)
        $q.notify({
          type: 'negative',
          message: 'Error al subir la foto',
          position: 'top'
        })
        uploadingPhoto.value = false
      },
      () => {
        // Upload completed
        void getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          form.value.photoURL = downloadURL

          $q.notify({
            type: 'positive',
            message: 'Foto subida correctamente',
            position: 'top'
          })

          uploadingPhoto.value = false
        })
      }
    )
  } catch (error) {
    console.error('Error uploading photo:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al subir la foto',
      position: 'top'
    })
    uploadingPhoto.value = false
  }
}

async function saveProfile() {
  if (!userStore.user?.uid || !userData.value?.__docId__) {
    $q.notify({
      type: 'warning',
      message: 'No se pudo identificar el usuario',
      position: 'top'
    })
    return
  }

  saving.value = true

  try {
    // Prepare data to update in users collection
    const updateData = {
      displayName: form.value.displayName,
      photoURL: form.value.photoURL,
      updatedAt: new Date(),
      ...(userData.value.role === 'player' ? {
        jerseyNumber: form.value.jerseyNumber,
        position: form.value.position,
        height: form.value.height,
        weight: form.value.weight,
        preferredFoot: form.value.preferredFoot
      } : {}),
      phone: form.value.phone,
      bio: form.value.bio
    }

    // 1. Update users collection
    const userDocRef = doc(db, 'users', userData.value.__docId__)
    await updateDoc(userDocRef, updateData)

    // 2. If player, also update players collection and playerParticipations
    if (userData.value.role === 'player') {
      // 2a. Update players collection
      const playersQuery = query(
        collection(db, 'players'),
        where('id', '==', userStore.user.uid)
      )
      const playersSnapshot = await getDocs(playersQuery)

      if (!playersSnapshot.empty) {
        const playerDoc = playersSnapshot.docs[0]
        if (playerDoc) {
          const playerUpdateData = {
            displayName: form.value.displayName,
            photoURL: form.value.photoURL,
            updatedAt: new Date()
          }

          await updateDoc(doc(db, 'players', playerDoc.id), playerUpdateData)
          console.log('[ProfilePage] Player document updated')
        }
      }

      // 2b. Update all playerParticipations for this player
      const participationsQuery = query(
        collection(db, 'playerParticipations'),
        where('playerId', '==', userStore.user.uid)
      )
      const participationsSnapshot = await getDocs(participationsQuery)

      if (!participationsSnapshot.empty) {
        console.log(`[ProfilePage] Updating ${participationsSnapshot.size} participation records`)

        const participationUpdates = participationsSnapshot.docs.map(participationDoc => {
          const participationUpdateData = {
            updatedAt: new Date(),
            ...(form.value.jerseyNumber !== null && form.value.jerseyNumber !== undefined ? {
              jersey: form.value.jerseyNumber
            } : {}),
            ...(form.value.position ? {
              position: positionToSpanish[form.value.position] || form.value.position
            } : {})
          }

          return updateDoc(doc(db, 'playerParticipations', participationDoc.id), participationUpdateData)
        })

        await Promise.all(participationUpdates)
        console.log('[ProfilePage] All playerParticipations updated')
      }
    }

    // Update local userData to avoid reloading and losing state
    // This prevents EssentialLinks from disappearing
    if (userData.value) {
      Object.assign(userData.value, {
        displayName: form.value.displayName,
        photoURL: form.value.photoURL
      })
    }

    $q.notify({
      type: 'positive',
      message: 'Perfil actualizado correctamente',
      position: 'top',
      icon: 'check_circle'
    })

    // Clear photo preview
    photoPreview.value = null
  } catch (error) {
    console.error('Error saving profile:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el perfil',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true

  try {
    // Ensure user data is loaded
    if (!userData.value && userStore.user?.uid) {
      await databaseStore.fetchUserData(userStore.user.uid)
    }

    loadUserData()
  } catch (error) {
    console.error('Error loading profile:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar el perfil',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.profile-page {
  background: #F5F7FA;
  min-height: 100vh;
  padding: 24px;
}

.profile-container {
  max-width: 900px;
  margin: 0 auto;
}

// Header
.profile-header {
  background: linear-gradient(135deg, #064F34 0%, #138A59 100%);
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;

  h1 {
    margin: 0;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
}

.header-icon {
  color: #F2C526;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

// Loading
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  gap: 16px;
}

// Content
.profile-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 768px) {
    grid-template-columns: 350px 1fr;
  }
}

// Photo Card
.photo-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

.photo-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 4px solid #064F34;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.photo-upload-btn {
  position: absolute;
  bottom: 5px;
  right: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

// Info Card
.info-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #064F34;
}

// Form
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
}

.field-hint {
  font-size: 0.75rem;
  color: #999;
  margin: 4px 0 0 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #E0E0E0;
}

// Responsive
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .profile-header {
    padding: 24px 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-content {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
