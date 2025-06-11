// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Box, Typography, Container } from '@mui/material';

export default function DashboardPage() {
  // Ambil user dari store Zustand
  const { user } = useAuthStore();
  const router = useRouter();

  // useEffect akan berjalan di sisi client setelah komponen render
  useEffect(() => {
    // Jika tidak ada user (setelah state terhidrasi dari localStorage),
    // redirect ke halaman login.
    if (!user) {
      router.push('/login');
    }
  }, [user, router]); // Dependency array, efek ini akan berjalan lagi jika user atau router berubah

  // Selama pengecekan atau proses redirect, tampilkan loading.
  // Ini penting untuk mencegah "kilatan" konten yang tidak seharusnya dilihat.
  if (!user) {
    return (
        <Container>
            <Typography>Loading...</Typography>
        </Container>
    );
  }

  // Jika kode berhasil sampai di sini, artinya user sudah terautentikasi.
  // Tampilkan konten dashboard yang sesungguhnya.
  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Selamat Datang di Dashboard!
        </Typography>
        <Typography variant="body1">
          Ini adalah halaman yang dilindungi. Hanya pengguna yang sudah login yang bisa melihat ini.
        </Typography>
        <Box sx={{ marginTop: 4 }}>
          <Typography variant="h6">Informasi Akun Anda:</Typography>
          <Typography>ID: {user.id}</Typography>
          <Typography>Nama: {user.name}</Typography>
          <Typography>Email: {user.email}</Typography>
          <Typography>Role: {user.role}</Typography>
        </Box>
      </Box>
    </Container>
  );
}