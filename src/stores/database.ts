// src/stores/database.ts
import { defineStore } from 'pinia'
import { db } from 'boot/firebase'
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'

export type AppRole = 'admin' | 'organizer' | 'captain' | 'player'

export interface AppUserProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: AppRole
  createdAt?: unknown
  updatedAt?: unknown
  __docId__?: string
}

export const useDatabaseStore = defineStore('database', {
  state: () => ({
    userData: null as AppUserProfile | null,
    loadingUserData: false,
    _unsubUserDoc: null as Unsubscribe | null
  }),

  actions: {
    /** Fetch una sola vez: busca users donde uid == uid (no asume docId) */
    async fetchUserData(uid: string) {
      this.loadingUserData = true
      try {
        const q = query(
          collection(db, 'users'),
          where('uid', '==', uid),
          limit(1)
        )
        const snap = await getDocs(q)

        if (snap.empty) {
          this.userData = null
          return null
        }

        const docSnap = snap.docs[0]
        if (!docSnap) {
          this.userData = null
          return null
        }
        this.userData = { ...(docSnap.data() as AppUserProfile), __docId__: docSnap.id }
        return this.userData
      } finally {
        this.loadingUserData = false
      }
    },
    startUserListener(uid: string) {
      this.stopUserListener()

      const q = query(
        collection(db, 'users'),
        where('uid', '==', uid),
        limit(1)
      )

      this._unsubUserDoc = onSnapshot(q, (qs) => {
        if (qs.empty) {
          this.userData = null
          return
        }
        const docSnap = qs.docs[0]
        const count = qs.size
        if (count > 1) {
          console.warn(`[database] Se encontraron ${count} docs con el mismo uid. Usando el primero.`)
        }
        if (docSnap) {
          this.userData = { ...(docSnap.data() as AppUserProfile), __docId__: docSnap.id }
        } else {
          this.userData = null
        }
      })
    },

    stopUserListener() {
      if (this._unsubUserDoc) {
        this._unsubUserDoc()
        this._unsubUserDoc = null
      }
    }
  }
})
