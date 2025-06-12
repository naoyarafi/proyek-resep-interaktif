'use client';

import { useAuthStore } from '@/store/authStore';
import { IUser } from '@/models/User.model';
import { Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';

export const dynamic = 'force-dynamic';

// ... (interface PlainUser dan UserActionButtonsProps tetap sama) ...
interface PlainUser { _id: string; isBlocked: boolean; }
interface UserActionButtonsProps { user: PlainUser; }

export default function UserActionButtons({ user }: UserActionButtonsProps) {
  const { accessToken, user: adminUser } = useAuthStore();
  const router = useRouter();

  const handleToggleBlock = async () => {
    // ... (fungsi handleToggleBlock Anda tetap sama persis) ...
    const action = user.isBlocked ? 'mengaktifkan' : 'memblokir';
    if (!confirm(`Apakah Anda yakin ingin ${action} user ini?`)) return;
    try {
      const res = await authFetch(`/api/admin/users/${user._id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken!}` }});
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Aksi gagal');
      }
      router.refresh();
    } catch (error: any) { alert(`Error: ${error.message}`); }
  };

  // ===== FUNGSI BARU UNTUK MENGHAPUS PENGGUNA =====
  const handleDeleteUser = async () => {
    if (!confirm('PERINGATAN: Aksi ini tidak dapat dibatalkan. Apakah Anda benar-benar yakin ingin menghapus pengguna ini secara permanen?')) return;

    try {
      const res = await authFetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken!}` },
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Gagal menghapus pengguna');
      }

      alert('Pengguna berhasil dihapus.');
      router.refresh(); // Refresh halaman untuk memperbarui daftar

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (adminUser?.id === user._id) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="contained"
        size="small"
        color={user.isBlocked ? 'success' : 'warning'}
        onClick={handleToggleBlock}
      >
        {user.isBlocked ? 'Aktifkan' : 'Blokir'}
      </Button>
      {/* Hubungkan fungsi baru ke tombol Hapus */}
      <Button 
        variant="outlined" 
        size="small" 
        color="error" 
        onClick={handleDeleteUser}
      >
        Hapus
      </Button>
    </Box>
  );
}