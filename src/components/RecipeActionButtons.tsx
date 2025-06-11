'use client';

import { useAuthStore } from "@/store/authStore";
import { Box, Button, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// Terima seluruh objek resep sebagai prop
interface RecipeActionButtonsProps {
  recipe: {
    _id: string;
    isSuspended: boolean;
    author: {
      _id: string;
    }
  }
}

export default function RecipeActionButtons({ recipe }: RecipeActionButtonsProps) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  const handleSuspendToggle = async () => {
    const action = recipe.isSuspended ? 'mengaktifkan' : 'menangguhkan';
    if (!confirm(`Apakah Anda yakin ingin ${action} resep ini?`)) return;

    try {
      const res = await fetch(`/api/admin/recipes/${recipe._id}/suspend`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken!}` },
      });
      if (!res.ok) throw new Error('Aksi gagal');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan');
    }
  };


  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus resep ini secara permanen?')) return;

    try {
      const res = await fetch(`/api/recipes/${recipe._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken!}` }
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Gagal menghapus resep');
      }

      // Jika berhasil, arahkan ke halaman utama
      router.push('/');
      router.refresh(); // Refresh halaman untuk data baru
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  // Tampilkan tombol hanya jika user login dan ID-nya cocok dengan ID penulis resep
  if (user && user.id === recipe.author._id.toString()) {
    return (
      <Box sx={{ my: 2, display: 'flex', gap: 1 }}>
        <Button
          component={Link}
          href={`/recipes/${recipe._id}/edit`}
          variant="contained"
          startIcon={<EditIcon />}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          startIcon={<DeleteIcon />}
        >
          Hapus
        </Button>
      </Box>
    );
  }

  // Jika bukan pemilik, jangan tampilkan apa-apa
  return null;
}