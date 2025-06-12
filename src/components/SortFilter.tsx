// src/components/SortFilter.tsx
'use client';

import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SortFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sortBy') || 'terbaru';

  const handleChange = (event: SelectChangeEvent) => {
    const newSortBy = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', newSortBy);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Urutkan</InputLabel>
      <Select
        value={currentSort}
        label="Urutkan"
        onChange={handleChange}
      >
        <MenuItem value="terbaru">Terbaru</MenuItem>
        <MenuItem value="terlama">Terlama</MenuItem>
        <MenuItem value="populer">Terpopuler</MenuItem>
      </Select>
    </FormControl>
  );
}