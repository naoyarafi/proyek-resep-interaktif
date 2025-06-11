// src/app/recipes/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, RecipeSchema } from '@/lib/validationSchemas';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useParams } from 'next/navigation';
import { ICategory } from '@/models/Category.model';
import { IRecipe } from '@/models/Recipe.model';
import { Container, Typography, Box, Grid, TextField, Button, IconButton, Select, MenuItem, FormControl, InputLabel, FormHelperText, CircularProgress, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const { user, accessToken } = useAuthStore();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset, // Fungsi dari react-hook-form untuk mengisi form
    formState: { errors, isSubmitting },
  } = useForm<RecipeSchema>({
    resolver: zodResolver(recipeSchema),
  });

  const { fields: mainFields, append: appendMain, remove: removeMain } = useFieldArray({ control, name: "mainIngredients" });
  const { fields: compFields, append: appendComp, remove: removeComp } = useFieldArray({ control, name: "complementaryIngredients" });

  // Efek untuk mengambil data resep yang akan diedit & data kategori
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) {
        router.push('/login');
        return;
      }
      try {
        // Ambil data resep
        const recipeRes = await fetch(`/api/recipes/${recipeId}`);
        if (!recipeRes.ok) throw new Error('Resep tidak ditemukan atau gagal dimuat');
        const recipeData = await recipeRes.json();

        // Pengecekan kepemilikan di frontend
        if (user?.id !== recipeData.data.author._id.toString()) {
            setApiError('Anda tidak berhak mengedit resep ini.');
            setIsLoading(false);
            return;
        }

        // Ambil data kategori
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data);
        }

        // Isi form dengan data yang sudah ada menggunakan reset()
        reset(recipeData.data);

      } catch (error: any) {
        setApiError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [recipeId, accessToken, reset, router, user?.id]);

  // Fungsi untuk submit data yang sudah diupdate
  const onSubmit: SubmitHandler<RecipeSchema> = async (data) => {
    setApiError(null);
    try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken!}`},
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Gagal memperbarui resep');

        // Jika berhasil, arahkan kembali ke halaman detail resep
        router.push(`/recipes/${recipeId}`);
    } catch (err: any) {
        setApiError(err.message);
    }
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (apiError) return <Container><Alert severity="error" sx={{ mt: 4 }}>{apiError}</Alert></Container>;

  // Tampilan form sama persis dengan halaman Add Recipe
  return (
    <Container maxWidth="md">
        {/* ... sisa kode JSX Anda yang panjang itu tidak berubah ... */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Resep
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