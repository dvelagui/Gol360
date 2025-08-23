import { boot } from 'quasar/wrappers'
import { initializeApp } from 'firebase/app'
import { type FirebaseApp } from 'firebase/app'
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'
import { getAuth as _getAuth, type Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app     = initializeApp(firebaseConfig)
const auth    = getAuth(app)
const db      = getFirestore(app)
const storage = getStorage(app)
const analytics = getAnalytics(app);

export default boot(() => {
  // Hooks
})

let _secondaryApp: FirebaseApp | null = null
let _secondaryAuth: Auth | null = null

export function getSecondaryAuth(): Auth {
  if (!_secondaryApp) {
    _secondaryApp = initializeApp(firebaseConfig, 'secondary')
  }
  if (!_secondaryAuth) {
    _secondaryAuth = _getAuth(_secondaryApp)
  }
  return _secondaryAuth
}


export { auth, db, storage, analytics }
