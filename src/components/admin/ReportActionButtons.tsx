'use client';

import { useAuthStore } from "@/store/authStore";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

interface ReportActionButtonsProps {
  report: {
    _id: string;
    status: 'pending' | 'reviewed';
  };
}

export default function ReportActionButtons({ report }: ReportActionButtonsProps) {
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const handleMarkAsReviewed = async () => {
    if (!confirm('Apakah Anda yakin ingin menandai laporan ini sudah ditinjau?')) return;

    try {
      const res = await fetch(`/api/admin/reports/${report._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken!}` },
      });
      if (!res.ok) throw new Error('Aksi gagal');

      router.refresh(); // Perbarui tampilan tabel
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memperbarui status.');
    }
  };

  // Jika status sudah 'reviewed', jangan tampilkan tombol
  if (report.status === 'reviewed') {
    return null; 
  }

  return (
    <Button
      variant="contained"
      size="small"
      onClick={handleMarkAsReviewed}
    >
      Tandai Selesai
    </Button>
  );
}