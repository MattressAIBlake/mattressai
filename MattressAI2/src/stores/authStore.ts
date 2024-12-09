import { create } from 'zustand';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../config/firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
}));

// Initialize auth listener
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
});