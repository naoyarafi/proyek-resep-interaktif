'use client';
import { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  recipeId: string;
  initialWishlist: string[];
}

export default function WishlistButton({ recipeId, initialWishlist }: WishlistButtonProps) {
  const { user, accessToken, setAuthData } = useAuthStore();
  const router = useRouter();

  // State internal untuk UI yang responsif
  const [isInWishlist, setIsInWishlist] = useState(initialWishlist.includes(recipeId));

  // Efek untuk sinkronisasi jika prop berubah (penting untuk navigasi)
  useEffect(() => {
    setIsInWishlist(initialWishlist.includes(recipeId));
  }, [initialWishlist, recipeId]);

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Simpan state lama untuk rollback jika gagal
    const previousState = isInWishlist;

    // Optimistic UI Update
    setIsInWishlist(!previousState);

    try {
      const res = await fetch('/api/users/me/wishlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken!}` },
        body: JSON.stringify({ recipeId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal update wishlist");

      // SINKRONISASI PENTING: Update state global Zustand dengan data baru dari server
      const newUserData = { ...user, wishlist: result.wishlist };
      setAuthData({ user: newUserData, accessToken: accessToken! });

    } catch (error) {
      console.error(error);
      // Rollback jika API call gagal
      setIsInWishlist(previousState);
    }
  };

  if (!user) return null;

  return (
    <IconButton onClick={handleToggleWishlist} aria-label="add to wishlist">
      {isInWishlist ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
    </IconButton>
  );
}