'use client';

import { useAuthStore } from "@/store/authStore";
import { Button, Box } from "@mui/material";
import { useRouter } from "next/navigation"; // Pastikan useRouter diimpor
import { authFetch } from '@/lib/authFetch';

export const dynamic = 'force-dynamic';

interface RecipeActionButtonsProps {
  recipe: {
    _id: string;
    isSuspended: boolean;
  };
}

export default function RecipeActionButtons({ recipe }: RecipeActionButtonsProps) {
  const { accessToken } = useAuthStore();
  const router = useRouter(); // Inisialisasi router

  const handleSuspendToggle = async () => {
    const action = recipe.isSuspended ? 'mengaktifkan' : 'menangguhkan';
    if (!confirm(`Apakah Anda yakin ingin ${action} resep ini?`)) return;

    try {
      const res = await authFetch(`/api/admin/recipes/${recipe._id}/suspend`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken!}` },
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Aksi gagal');
      }
      
      // ===== INI BAGIAN PENTINGNYA =====
      // Memberitahu Next.js untuk memuat ulang data Server Component
      router.refresh();

    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('PERINGATAN: Aksi ini akan menghapus resep secara permanen. Lanjutkan?')) return;
    try {
      const res = await authFetch(`/api/recipes/${recipe._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken!}` },
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Gagal menghapus pengguna');
      }
      alert('Resep berhasil dihapus.');
      
      // Refresh halaman di sini juga
      router.refresh();
      
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="contained"
        size="small"
        color={recipe.isSuspended ? 'success' : 'warning'}
        onClick={handleSuspendToggle}
      >
        {recipe.isSuspended ? 'Aktifkan' : 'Tangguhkan'}
      </Button>
      <Button variant="outlined" size="small" color="error" onClick={handleDelete}>
        Hapus
      </Button>
    </Box>
  );
}