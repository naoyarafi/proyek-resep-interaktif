import { Suspense } from 'react';
import { Container, Typography, Box, Paper, Divider, Skeleton, CircularProgress } from "@mui/material";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { cookies } from 'next/headers'; 
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

// Impor Komponen Client & Model
import IngredientCalculator from "@/components/IngredientCalculator";
import ReactionButtons from "@/components/ReactionButtons";
import CommentsSection from "@/components/CommentsSection";
import RecipeActionButtons from "@/components/RecipeActionButtons";
import ReportRecipeButton from "@/components/ReportRecipeButton";
import WishlistButton from "@/components/WishlistButton";
import User from "@/models/User.model";
import dbConnect from "@/lib/dbConnect";
import Recipe from '@/models/Recipe.model';

// Fungsi untuk mengambil data satu resep
async function getRecipeById(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/recipes/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Gagal fetch resep by id:", error);
    return null;
  }
}

// Fungsi untuk mengambil wishlist pengguna
async function getUserWishlist(): Promise<string[]> {
    await dbConnect();
    try {
        const tokenCookie = cookies().get('accessToken');
        const token = tokenCookie?.value;
        if (!token) return [];

        const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const user = await User.findById(userId).select('wishlist').lean() as { wishlist: mongoose.Types.ObjectId[] } | null;
        if (!user || !user.wishlist) return [];
        
        return user.wishlist.map((id) => id.toString());
    } catch (error) {
        return [];
    }
}

// Fungsi untuk generate metadata dinamis (tidak berubah)
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const recipe = await getRecipeById(params.id);
  if (!recipe) {
    return { title: 'Resep Tidak Ditemukan' };
  }
  return {
    title: `${recipe.title} - Resep Interaktif`,
    description: recipe.description.substring(0, 160),
  };
}

// Komponen untuk tampilan loading skeleton
function RecipeDetailSkeleton() {
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
                <Skeleton variant="text" sx={{ fontSize: '2rem' }} width="80%" />
                <Skeleton variant="text" width="40%" sx={{ mb: 2 }}/>
                <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
                <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 4 }} width="50%" />
                <Skeleton variant="text" height={80} />
                <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 4 }} width="60%" />
                <Skeleton variant="text" height={120} />
            </Paper>
        </Container>
    );
}

// Komponen baru untuk isi halaman (yang akan "ditunggu" oleh Suspense)
async function RecipeContent({ id }: { id: string }) {
    // Ambil data resep dan wishlist secara bersamaan
    const [recipe, initialWishlist] = await Promise.all([
        getRecipeById(id),
        getUserWishlist()
    ]);

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                        <ReactionButtons recipeId={recipe._id.toString()} />
                        <WishlistButton recipeId={recipe._id.toString()} initialWishlist={initialWishlist} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                        <RecipeActionButtons recipe={serializableRecipe} />
                        <ReportRecipeButton recipeId={recipe._id.toString()} />
                    </Box>
                </Box>
                
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

// Komponen Halaman Utama (default export) sekarang hanya mengatur Suspense
export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<RecipeDetailSkeleton />}>
      <RecipeContent id={params.id} />
    </Suspense>
  );
}