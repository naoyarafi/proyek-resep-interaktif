"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, RecipeSchema } from "@/lib/validationSchemas";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { ICategory } from "@/models/Category.model";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default function AddRecipePage() {
  // ===== SEMUA HOOKS SEKARANG BERADA DI TEMPAT YANG BENAR =====
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Hook untuk upload gambar, dipindahkan ke sini
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecipeSchema>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { mainIngredients: [{ name: "", defaultQuantity: 1 }] },
  });

  const {
    fields: mainFields,
    append: appendMain,
    remove: removeMain,
  } = useFieldArray({ control, name: "mainIngredients" });
  const {
    fields: compFields,
    append: appendComp,
    remove: removeComp,
  } = useFieldArray({ control, name: "complementaryIngredients" });
  // =============================================================

  useEffect(() => {
    // Cek status login
    if (!user) {
      // Kita tambahkan timeout kecil untuk memberi waktu Zustand rehidrasi
      const timer = setTimeout(() => {
        if (!useAuthStore.getState().user) {
          router.push("/login");
        } else {
          setIsCheckingAuth(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsCheckingAuth(false);
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil kategori", error);
      }
    };

    fetchCategories();
  }, [user, router]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploading(true);
    setApiError(null);
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        }
      );
      if (!response.ok) throw new Error("Gagal meng-upload file.");
      const newBlob = await response.json();
      setImagePreview(newBlob.url);
      setValue("imageUrl", newBlob.url, { shouldValidate: true });
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<RecipeSchema> = async (data) => {
    setApiError(null);
    if (!accessToken) {
      setApiError("Anda harus login untuk membuat resep.");
      return;
    }
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Gagal menyimpan resep");
      router.push("/dashboard");
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  if (isCheckingAuth) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ mt: 4, mb: 4 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Tambah Resep Baru
        </Typography>

        {apiError && (
          <Alert severity="error" sx={{ my: 2 }}>
            {apiError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Judul Resep"
              {...register("title")}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Gambar Resep
            </Typography>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={inputFileRef}
              onChange={handleFileChange}
            />
            <Button
              variant="outlined"
              onClick={() => inputFileRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Mengunggah..." : "Pilih Gambar"}
            </Button>
            {/* Kita akan hapus field URL gambar yang lama karena sudah digantikan tombol upload */}
            {errors.imageUrl && !imagePreview && (
              <FormHelperText error>{errors.imageUrl.message}</FormHelperText>
            )}
          </Grid>

          {imagePreview && (
            <Grid item xs={12}>
              <Box
                sx={{
                  mt: 2,
                  width: 200,
                  height: 200,
                  position: "relative",
                  border: "1px dashed grey",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </Box>
            </Grid>
          )}

          {/* ... sisa kode JSX Anda (Deskripsi, Kategori, Bahan, dll.) sama persis ... */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Deskripsi / Langkah-langkah"
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.category}>
              <InputLabel>Kategori</InputLabel>
              <Select
                label="Kategori"
                {...register("category")}
                defaultValue=""
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id.toString()} value={cat._id.toString()}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.category?.message}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Satuan Bahan Utama (e.g., kg, ekor, buah)"
              {...register("mainIngredientUnit")}
              error={!!errors.mainIngredientUnit}
              helperText={errors.mainIngredientUnit?.message}
            />
          </Grid>
        </Grid>

        <Box mt={4}>
          <Typography variant="h6">Bahan Utama</Typography>
          {mainFields.map((field, index) => (
            <Grid
              container
              spacing={1}
              key={field.id}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nama Bahan"
                  {...register(`mainIngredients.${index}.name`)}
                  error={!!errors.mainIngredients?.[index]?.name}
                  helperText={errors.mainIngredients?.[index]?.name?.message}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Jumlah"
                  {...register(`mainIngredients.${index}.defaultQuantity`, {
                    valueAsNumber: true,
                  })}
                  error={!!errors.mainIngredients?.[index]?.defaultQuantity}
                  helperText={
                    errors.mainIngredients?.[index]?.defaultQuantity?.message
                  }
                  inputProps={{ min: 0, step: "any" }}
                />
              </Grid>
              <Grid item xs={1}>
                {mainFields.length > 1 && (
                  <IconButton onClick={() => removeMain(index)}>
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => appendMain({ name: "", defaultQuantity: 1 })}
          >
            Tambah Bahan Utama
          </Button>
        </Box>
        <Box mt={4}>
          <Typography variant="h6">Bahan Pelengkap</Typography>
          {compFields.map((field, index) => (
            <Grid
              container
              spacing={1}
              key={field.id}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nama Bahan"
                  {...register(`complementaryIngredients.${index}.name`)}
                  error={!!errors.complementaryIngredients?.[index]?.name}
                  helperText={
                    errors.complementaryIngredients?.[index]?.name?.message
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Jumlah"
                  {...register(
                    `complementaryIngredients.${index}.quantityPerUnit`,
                    { valueAsNumber: true }
                  )}
                  error={
                    !!errors.complementaryIngredients?.[index]?.quantityPerUnit
                  }
                  helperText={
                    errors.complementaryIngredients?.[index]?.quantityPerUnit
                      ?.message
                  }
                  inputProps={{ min: 0, step: "any" }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Satuan"
                  {...register(`complementaryIngredients.${index}.unit`)}
                  error={!!errors.complementaryIngredients?.[index]?.unit}
                  helperText={
                    errors.complementaryIngredients?.[index]?.unit?.message
                  }
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton onClick={() => removeComp(index)}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={() =>
              appendComp({ name: "", quantityPerUnit: 1, unit: "" })
            }
          >
            Tambah Bahan Pelengkap
          </Button>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Resep"}
        </Button>
      </Box>
    </Container>
  );
}
