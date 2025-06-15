'use client';
import { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  recipeId: string;
  initialWishlist: string[]; // Daftar ID wishlist awal dari user
}

export default function WishlistButton({ recipeId, initialWishlist }: WishlistButtonProps) {
  const { user, accessToken, setAuthData } = useAuthStore();
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(initialWishlist.includes(recipeId));

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Optimistic UI Update
    setIsInWishlist(!isInWishlist);

    try {
      const res = await fetch('/api/users/me/wishlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken!}` },
        body: JSON.stringify({ recipeId }),
      });

      if (!res.ok) {
          // Jika gagal, kembalikan ke state semula
          setIsInWishlist(isInWishlist);
          throw new Error("Gagal update wishlist");
      }
      // Optional: update Zustand store
    } catch (error) {
      console.error(error);
    }
  };

  if(!user) return null; // Jangan tampilkan tombol jika tidak login

  return (
    <IconButton onClick={handleToggleWishlist}>
      {isInWishlist ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
    </IconButton>
  );
}