'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Alert } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';

interface ReportRecipeButtonProps {
  recipeId: string;
}

export default function ReportRecipeButton({ recipeId }: ReportRecipeButtonProps) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  // State untuk mengontrol dialog
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClickOpen = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setOpen(true);
    // Reset state setiap kali dialog dibuka
    setError(null);
    setSuccess(null);
    setReason('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken!}`,
        },
        body: JSON.stringify({ recipeId, reason }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal mengirim laporan.');
      }

      setSuccess(result.message);
      // Tutup dialog setelah 2 detik jika berhasil
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jangan tampilkan tombol sama sekali jika user tidak login
  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="warning"
        startIcon={<FlagIcon />}
        onClick={handleClickOpen}
      >
        Laporkan
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Laporkan Resep</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Apakah Anda menemukan masalah dengan resep ini? Beri tahu kami alasannya.
          </DialogContentText>

          {/* Tampilkan pesan error atau sukses di dalam dialog */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Alasan (Opsional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting || !!success}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>Batal</Button>
          <Button onClick={handleSubmitReport} variant="contained" color="primary" disabled={isSubmitting || !!success}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}