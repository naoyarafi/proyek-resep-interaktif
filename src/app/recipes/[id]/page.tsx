// src/app/recipes/[id]/page.tsx

import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";

// Komponen-komponen Client
import IngredientCalculator from "@/components/IngredientCalculator";
import ReactionButtons from "@/components/ReactionButtons";
import CommentsSection from "@/components/CommentsSection";
import RecipeActionButtons from "@/components/RecipeActionButtons"; // Memastikan impor ke komponen yang benar
import ReportRecipeButton from "@/components/ReportRecipeButton";

export const dynamic = 'force-dynamic';

async function getRecipeById(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/recipes/${id}`, { cache: 'no-store' });
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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const recipe = await getRecipeById(params.id);

  if (!recipe) {
    return {
      title: 'Resep Tidak Ditemukan',
      description: 'Resep yang Anda cari tidak ada atau telah dihapus.',
    }
  }

  return {
    title: `${recipe.title} - Resep Interaktif`,
    description: recipe.description.substring(0, 160),
  }
}

export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const recipe = await getRecipeById(params.id);

  if (!recipe) {
    notFound();
  }

  // Trik untuk mengirim data kompleks dari Server ke Client Component dengan aman
  const serializableRecipe = JSON.parse(JSON.stringify(recipe));

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {recipe.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Oleh: {recipe.author?.name || "Anonim"} | Kategori: {recipe.category?.name || "N/A"}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', my: 2 }}>
          {/* Tombol Aksi untuk pemilik & admin */}
          <RecipeActionButtons recipe={serializableRecipe} />
          {/* Tombol Lapor untuk semua user yang login */}
          <ReportRecipeButton recipeId={recipe._id.toString()} />
        </Box>
        
        {/* Tombol Reaksi untuk semua user yang login */}
        <ReactionButtons recipeId={recipe._id.toString()} />

        <Box sx={{ my: 3, position: "relative", width: "100%", height: { xs: 250, sm: 400 } }}>
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover", borderRadius: "8px" }}
            priority
          />
        </Box>

        {/* Kalkulator bahan interaktif yang sudah pintar memformat angka */}
        <IngredientCalculator recipe={serializableRecipe} />

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>Langkah-langkah</Typography>
        <Typography variant="body1" component="div" sx={{ whiteSpace: "pre-wrap" }}>
          {recipe.description}
        </Typography>
      </Paper>
      
      <CommentsSection recipeId={recipe._id.toString()} />
    </Container>
  );
}