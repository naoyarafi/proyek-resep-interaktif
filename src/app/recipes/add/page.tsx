// src/app/recipes/add/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, RecipeSchema } from '@/lib/validationSchemas';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ICategory } from '@/models/Category.model';
import { Container, Typography, Box, Grid, TextField, Button, IconButton, Select, MenuItem, FormControl, InputLabel, FormHelperText, CircularProgress } from '@mui/material'; // Tambahkan CircularProgress
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Alert from '@mui/material/Alert'; // Pastikan Alert diimpor


export default function AddRecipePage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // ===== BAGIAN BARU: State untuk melacak status hidrasi =====
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const {
    // ... sisa useForm ...
    register, handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm<RecipeSchema>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { mainIngredients: [{ name: '', defaultQuantity: 1 }], complementaryIngredients: [{ name: '', quantityPerUnit: 1, unit: '' }],},
  });

  const { fields: mainFields, append: appendMain, remove: removeMain } = useFieldArray({ control, name: "mainIngredients" });
  const { fields: compFields, append: appendComp, remove: removeComp } = useFieldArray({ control, name: "complementaryIngredients" });

  // ===== BAGIAN YANG DIPERBARUI: Logika Proteksi Halaman =====
  useEffect(() => {
    // Cek status login dari store Zustand
    // Karena store di-persist, kita perlu memberinya waktu untuk rehidrasi
    // useAuthStore.persist.onFinishHydration akan lebih canggih, tapi ini cara simpelnya:
    const state = useAuthStore.getState();
    if (!state.user) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false); // Selesai memeriksa, user ada
    }

    const fetchCategories = async () => {
      //... (logika fetch kategori tetap sama)
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Gagal mengambil kategori', error);
      }
    };

    fetchCategories();
  }, [router]); // dependency array diubah agar tidak memicu redirect berulang

  const onSubmit: SubmitHandler<RecipeSchema> = async (data) => {
    //... (logika onSubmit tetap sama)
    setApiError(null);
    if (!accessToken) {
        setApiError('Anda harus login untuk membuat resep.');
        return;
    }
    try {
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`},
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.message || 'Gagal menyimpan resep'); }
        router.push('/dashboard');
    } catch (err: any) {
        setApiError(err.message);
    }
  };
  
  // Tampilkan loading spinner selama proses pengecekan auth
  if (isCheckingAuth) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  // ===== Bagian JSX (Tampilan) - Tidak ada perubahan signifikan di sini =====
  return (
    <Container maxWidth="md">
        {/* ... sisa kode JSX Anda yang panjang itu tidak berubah ... */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tambah Resep Baru
        </Typography>

        {/* --- Form Utama --- */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label="Judul Resep" {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="URL Gambar" {...register('imageUrl')} error={!!errors.imageUrl} helperText={errors.imageUrl?.message} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={4} label="Deskripsi / Langkah-langkah" {...register('description')} error={!!errors.description} helperText={errors.description?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Kategori</InputLabel>
                <Select label="Kategori" {...register('category')} defaultValue="">
                    {categories.map((cat) => (
                        <MenuItem key={cat._id.toString()} value={cat._id.toString()}>{cat.name}</MenuItem>
                    ))}
                </Select>
                <FormHelperText>{errors.category?.message}</FormHelperText>
            </FormControl>
          </Grid>
           <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Satuan Bahan Utama (e.g., kg, ekor, buah)" {...register('mainIngredientUnit')} error={!!errors.mainIngredientUnit} helperText={errors.mainIngredientUnit?.message} />
          </Grid>
        </Grid>

        {/* --- Bahan Utama Dinamis --- */}
        <Box mt={4}>
          <Typography variant="h6">Bahan Utama</Typography>
          {mainFields.map((field, index) => (
            <Grid container spacing={1} key={field.id} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={7}>
                <TextField fullWidth size="small" label="Nama Bahan" {...register(`mainIngredients.${index}.name`)} error={!!errors.mainIngredients?.[index]?.name} helperText={errors.mainIngredients?.[index]?.name?.message} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="number" label="Jumlah" {...register(`mainIngredients.${index}.defaultQuantity`, { valueAsNumber: true })} error={!!errors.mainIngredients?.[index]?.defaultQuantity} helperText={errors.mainIngredients?.[index]?.defaultQuantity?.message} />
              </Grid>
              <Grid item xs={1}>
                {mainFields.length > 1 && <IconButton onClick={() => removeMain(index)}><RemoveCircleOutlineIcon /></IconButton>}
              </Grid>
            </Grid>
          ))}
          <Button startIcon={<AddCircleOutlineIcon />} onClick={() => appendMain({ name: '', defaultQuantity: 1 })}>Tambah Bahan Utama</Button>
        </Box>

        {/* --- Bahan Pelengkap Dinamis --- */}
        <Box mt={4}>
          <Typography variant="h6">Bahan Pelengkap</Typography>
          {compFields.map((field, index) => (
            <Grid container spacing={1} key={field.id} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={5}>
                <TextField fullWidth size="small" label="Nama Bahan" {...register(`complementaryIngredients.${index}.name`)} error={!!errors.complementaryIngredients?.[index]?.name} helperText={errors.complementaryIngredients?.[index]?.name?.message} />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth size="small" type="number" label="Jumlah" {...register(`complementaryIngredients.${index}.quantityPerUnit`, { valueAsNumber: true })} error={!!errors.complementaryIngredients?.[index]?.quantityPerUnit} helperText={errors.complementaryIngredients?.[index]?.quantityPerUnit?.message} />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth size="small" label="Satuan" {...register(`complementaryIngredients.${index}.unit`)} error={!!errors.complementaryIngredients?.[index]?.unit} helperText={errors.complementaryIngredients?.[index]?.unit?.message} />
              </Grid>
              <Grid item xs={1}>
                 <IconButton onClick={() => removeComp(index)}><RemoveCircleOutlineIcon /></IconButton>
              </Grid>
            </Grid>
          ))}
           <Button startIcon={<AddCircleOutlineIcon />} onClick={() => appendComp({ name: '', quantityPerUnit: 1, unit: '' })}>Tambah Bahan Pelengkap</Button>
        </Box>

        {/* --- Tombol Submit --- */}
        {apiError && <Alert severity="error" sx={{ mt: 2 }}>{apiError}</Alert>}
        <Button type="submit" variant="contained" size="large" sx={{ mt: 4 }} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Resep'}
        </Button>
      </Box>
    </Container>
  );
}