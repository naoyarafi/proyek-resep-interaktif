import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definisikan tipe untuk state dan action
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profilePictureUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  setAuthData: (data: { user: UserProfile, accessToken: string }) => void;
  clearAuthData: () => void;
}

// Buat store dengan Zustand
export const useAuthStore = create<AuthState>()(
  // `persist` adalah middleware untuk menyimpan state ke localStorage.
  // Ini membuat pengguna tetap login bahkan setelah me-refresh halaman.
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuthData: (data) => set({ user: data.user, accessToken: data.accessToken }),
      clearAuthData: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage', // nama item di localStorage
    }
  )
);