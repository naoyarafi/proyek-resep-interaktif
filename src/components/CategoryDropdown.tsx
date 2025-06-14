'use client';

import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, SelectChangeEvent } from '@mui/material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ICategory } from '@/models/Category.model';

export default function CategoryDropdown() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Ambil nilai kategori saat ini dari URL untuk nilai default dropdown
  const currentCategory = searchParams.get('category') || '';

  // Mengambil data kategori saat komponen dimuat
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Gagal mengambil kategori', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fungsi yang berjalan saat pengguna memilih kategori baru
  const handleChange = (event: SelectChangeEvent) => {
    const categoryId = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category'); // Hapus parameter jika memilih "Semua Kategori"
    }

    // Reset ke halaman 1 setiap kali filter berubah
    params.delete('page');

    router.push(`<span class="math-inline">\{pathname\}?</span>{params.toString()}`);
  };

  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel>Filter Kategori</InputLabel>
      <Select
        value={currentCategory}
        label="Filter Kategori"
        onChange={handleChange}
      >
        <MenuItem value="">
          <em>Semua Kategori</em>
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category._id.toString()} value={category._id.toString()}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}