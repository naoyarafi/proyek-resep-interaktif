'use client';

import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, SelectChangeEvent } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ICategory } from '@/models/Category.model';

export default function CategoryDropdown() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get('category') || '';

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

  const handleChange = (event: SelectChangeEvent) => {
    const categoryId = event.target.value;

    // Ambil semua query parameter yang sudah ada
    const currentQuery: { [key: string]: string } = {};
    searchParams.forEach((value, key) => {
        currentQuery[key] = value;
    });

    // Buat query baru
    let newQuery: any = { ...currentQuery };
    if (categoryId) {
        newQuery.category = categoryId;
    } else {
        delete newQuery.category;
    }
    
    // Selalu reset ke halaman 1 saat filter diubah
    delete newQuery.page;
    
    // Gunakan router dengan objek query, ini lebih aman
    router.push(`/?${new URLSearchParams(newQuery).toString()}`);
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