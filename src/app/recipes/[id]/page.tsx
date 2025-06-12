// src/app/recipes/[id]/page.tsx

import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { notFound } from "next/navigation"; // Fungsi khusus Next.js untuk menampilkan halaman 404
import Image from "next/image";
import IngredientCalculator from "@/components/IngredientCalculator";
import ReactionButtons from "@/components/ReactionButtons";
import CommentsSection from "@/components/CommentsSection";
import RecipeActionButtons from "@/components/RecipeActionButtons";
import ReportRecipeButton from "@/components/ReportRecipeButton";
export const dynamic = 'force-dynamic';

// Fungsi untuk mengambil data satu resep
async function getRecipeById(id: string) {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? `https://YOUR_PRODUCTION_URL/api/recipes/${id}`
      : `http://localhost:3000/api/recipes/${id}`;

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return null;
    }
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Komponen halaman menerima 'params' secara otomatis dari URL
export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const recipe = await getRecipeById(params.id);

  // Jika resep tidak ditemukan, tampilkan halaman 404 standar dari Next.js
  if (!recipe) {
    notFound();
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {recipe.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Oleh: {recipe.author?.name || "Anonim"} | Kategori:{" "}
          {recipe.category?.name || "N/A"}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <RecipeActionButtons recipe={recipe} />
          <ReportRecipeButton recipeId={recipe._id.toString()} />
        </Box>
        <ReactionButtons recipeId={recipe._id.toString()} />

        <Box
          sx={{ my: 3, position: "relative", width: "100%", height: "400px" }}
        >
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            style={{ objectFit: "cover", borderRadius: "8px" }}
            priority
          />
        </Box>

        {/* Di sini nanti kita akan ganti dengan Kalkulator Bahan Interaktif */}
        <IngredientCalculator recipe={recipe} />

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>
          Langkah-langkah
        </Typography>
        {/* Tampilkan deskripsi dengan mempertahankan format baris baru */}
        <Typography
          variant="body1"
          component="div"
          sx={{ whiteSpace: "pre-wrap" }}
        >
          {recipe.description}
        </Typography>
      </Paper>
      <CommentsSection recipeId={recipe._id.toString()} />
    </Container>
  );
}
