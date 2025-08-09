import type { Timestamp } from 'firebase/firestore';

export type AppRole = 'admin' | 'organizer' | 'captain' | 'player'

export interface AppUserProfile {
  uid: string
  displayName: string | null
  email: string | null
  role: AppRole
  registeredAt?: Timestamp
  avatar?: string | null
}
