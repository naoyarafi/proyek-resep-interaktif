'use client';
import { Pagination } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaginationControlProps {
  totalPages: number;
  currentPage: number;
}

export default function PaginationControl({ totalPages, currentPage }: PaginationControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', value.toString());
    router.push(`<span class="math-inline">\{pathname\}?</span>{params.toString()}`);
  };

  if (totalPages <= 1) return null; // Jangan tampilkan jika hanya 1 halaman

  return (
    <Pagination
      count={totalPages}
      page={currentPage}
      onChange={handleChange}
      color="primary"
      sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}
    />
  );
}