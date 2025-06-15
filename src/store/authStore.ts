import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profilePictureUrl?: string;
  wishlist: string[]; // <-- Tambahkan wishlist di sini
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  // Perbarui tipe data yang disimpan
  setAuthData: (data: { user: UserProfile, accessToken: string }) => void;
  clearAuthData: () => void;
  // Tambahkan action baru untuk toggle wishlist
  toggleWishlist: (recipeId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuthData: (data) => set({ 
        user: data.user, 
        accessToken: data.accessToken 
      }),
      clearAuthData: () => set({ user: null, accessToken: null }),

      // Logika baru untuk toggle wishlist
      toggleWishlist: (recipeId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const isInWishlist = currentUser.wishlist.includes(recipeId);
        const newWishlist = isInWishlist
          ? currentUser.wishlist.filter(id => id !== recipeId) // Hapus jika sudah ada
          : [...currentUser.wishlist, recipeId]; // Tambah jika belum ada

        // Perbarui user di dalam state
        set({ user: { ...currentUser, wishlist: newWishlist } });
      },
    }),
    { name: 'auth-storage' }
  )
);