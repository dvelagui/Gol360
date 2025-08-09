import { defineStore } from 'pinia';
import { auth } from '@/boot/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useDatabaseStore } from '@/stores/database';

interface UserState {
  user: User | null;
  loading: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: true,
  }),

  actions: {
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
