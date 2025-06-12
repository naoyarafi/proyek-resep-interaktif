'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, IconButton, Typography, Badge, CircularProgress } from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { authFetch } from '@/lib/authFetch';

export const dynamic = 'force-dynamic';

interface ReactionButtonsProps {
  recipeId: string;
}

type ReactionType = 'like' | 'love';

export default function ReactionButtons({ recipeId }: ReactionButtonsProps) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  const [likes, setLikes] = useState(0);
  const [loves, setLoves] = useState(0);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReactions = async () => {
      setIsLoading(true);
      try {
        const headers: HeadersInit = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
        const res = await authFetch(`/api/recipes/${recipeId}/reactions`, { headers });
        const data = await res.json();
        if (data.success) {
          setLikes(data.data.likes);
          setLoves(data.data.loves);
          setUserReaction(data.data.userReaction);
        }
      } catch (error) {
        console.error("Gagal mengambil reaksi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReactions();
  }, [recipeId, accessToken]);

  const handleReaction = async (newReaction: ReactionType) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const oldReaction = userReaction;
    let method = 'POST';

    // --- LOGIKA BARU YANG LEBIH JELAS ---
    if (oldReaction === newReaction) {
      // --- KASUS 1: BATALKAN REAKSI ---
      // User mengklik tombol yang sama lagi
      method = 'DELETE';
      setUserReaction(null); // Hapus reaksi dari UI
      if (newReaction === 'like') setLikes(l => l - 1);
      else setLoves(l => l - 1);

    } else {
      // --- KASUS 2: TAMBAH ATAU UBAH REAKSI ---
      method = 'POST';
      setUserReaction(newReaction); // Atur reaksi baru di UI

      // Tambah jumlah untuk reaksi baru
      if (newReaction === 'like') setLikes(l => l + 1);
      else setLoves(l => l + 1);

      // Jika ada reaksi lama, kurangi jumlahnya
      if (oldReaction === 'like') setLikes(l => l - 1);
      else if (oldReaction === 'love') setLoves(l => l - 1);
    }

    // Kirim request ke API sesuai dengan metode yang ditentukan
    try {
        const options: RequestInit = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken!}`,
            },
        };
        // Hanya tambahkan body untuk request POST
        if (method === 'POST') {
            options.body = JSON.stringify({ type: newReaction });
        }

        const response = await authFetch(`/api/recipes/${recipeId}/reactions`, options);
        if (!response.ok) {
            // Jika gagal, idealnya kita fetch ulang data dari server untuk sinkronisasi
            // Untuk sekarang, kita log error saja
            throw new Error('Gagal menyimpan reaksi ke server');
        }
    } catch (error) {
      console.error(error);
      // TODO: Implementasi rollback jika API gagal
    }
  };

  if (isLoading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <IconButton onClick={() => handleReaction('like')} color={userReaction === 'like' ? 'primary' : 'default'}>
        <Badge badgeContent={likes} color="primary">
            {userReaction === 'like' ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
        </Badge>
      </IconButton>
      <IconButton onClick={() => handleReaction('love')} color={userReaction === 'love' ? 'error' : 'default'}>
         <Badge badgeContent={loves} color="error">
            {userReaction === 'love' ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </Badge>
      </IconButton>
    </Box>
  );
}