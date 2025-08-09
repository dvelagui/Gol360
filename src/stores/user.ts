import { defineStore } from 'pinia';
import { auth } from '@/boot/firebase';
import {
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { upsertUserDocMinimal } from '@/services/firebase/firestore';
import type { AppRole } from '@/types/auth';
import type { User } from 'firebase/auth';
import { useDatabaseStore } from '@/stores/database';

const ALLOWED_ROLES: AppRole[] = ['admin', 'organizer', 'captain', 'player'];
const DEFAULT_AVATAR = 'https://cdn.quasar.dev/img/avatar.png';
interface UserState {
  user: User | null;
  loading: boolean;
}
const actionCodeSettings = {
  url: `${window.location.origin}/auth/reset-password/confirm`,
  handleCodeInApp: true
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: true,
  }),

  actions: {
    async register(params: {
      email: string;
      password: string;
      displayName: string;
      role: AppRole;
    }) {
      const { email, password, displayName, role } = params;

      if (!ALLOWED_ROLES.includes(role)) {
        throw new Error('Rol inválido');
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(cred.user, { displayName });

      await upsertUserDocMinimal({
        uid: cred.user.uid,
        displayName,
        email,
        role,
        avatar: DEFAULT_AVATAR,
      });

      const database = useDatabaseStore();
      database.startUserListener(cred.user.uid);
      this.user = cred.user;
      return cred.user;
    },
    async login(email: string, password: string) {
      this.loading = true;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        console.log('Login successful:', this.user);

        return true;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await signOut(auth);
        this.user = null;
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
    async sendPasswordReset(email: string) {
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
    },

    async verifyResetCode(oobCode: string) {
      // Devuelve el email asociado (útil para mostrarlo)
      return await verifyPasswordResetCode(auth, oobCode)
    },

    async confirmNewPassword(oobCode: string, newPassword: string) {
      await confirmPasswordReset(auth, oobCode, newPassword)
    },
    async fetchUserOnAuthChange() {
      return new Promise<void>((resolve) => {
        onAuthStateChanged(auth, (user) => {
          const database = useDatabaseStore();
          this.user = user;
          if (user) {
            database.startUserListener(user.uid);
          } else {
            database.stopUserListener();
            database.userData = null;
          }
          this.loading = false;
          resolve();
        });
      });
    },
  },
});
