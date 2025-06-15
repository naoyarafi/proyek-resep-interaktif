import { Suspense } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress
} from "@mui/material";
import CategorySidebar from "@/components/CategorySidebar";
import SortFilter from "@/components/SortFilter";
import PaginationControl from '@/components/PaginationControl';
import CategoryDropdown from "@/components/CategoryDropdown";
import RecipeCard from "@/components/RecipeCard";
import { getUserWishlist } from "@/lib/session";
import RecipeCardSkeleton from '@/components/RecipeCardSkeleton';

export const dynamic = 'force-dynamic';

// Fungsi getRecipes tetap sama, tugasnya mengambil data dari API
async function getRecipes(searchParams: { [key: string]: string | string[] | undefined }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';
  const query = new URLSearchParams(searchParams as Record<string, string>).toString();
  try {
    const res = await fetch(`${baseUrl}/api/recipes?${query}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Gagal mengambil data resep dari server");
    }
    return await res.json();
  } catch (error) {
    console.error("Error saat fetching resep:", error);
    return { success: false, data: [], pagination: { totalPages: 0, currentPage: 1 } };
  }
}

// Komponen BARU untuk menampilkan daftar resep dan paginasi
// Dibuat async agar bisa mengambil data
async function RecipeList({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Panggil kedua fungsi pengambilan data secara bersamaan
  const getRecipesData = getRecipes(searchParams);
  const getWishlistData = getUserWishlist();
  
  // Tunggu keduanya selesai
  const [recipeResponse, initialWishlist] = await Promise.all([
    getRecipesData,
    getWishlistData,
  ]);

  const { data: recipes, pagination } = recipeResponse;

  return (
    <>
      <Grid container spacing={4}>
        {recipes && recipes.length > 0 ? (
          recipes.map((recipe: any) => (
            <Grid item key={recipe._id} xs={12} sm={6} lg={4}>
              <RecipeCard recipe={recipe} initialWishlist={initialWishlist} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography align="center" sx={{ mt: 4, color: "text.secondary" }}>
              Tidak ada resep yang cocok dengan pencarian Anda.
            </Typography>
          </Grid>
        )}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 5 }}>
        <PaginationControl
          totalPages={pagination?.totalPages || 0}
          currentPage={pagination?.currentPage || 1}
        />
      </Box>
    </>
  );
}


function RecipeListFallback() {
    return (
        <Grid container spacing={4}>
            {Array.from(new Array(6)).map((_, index) => (
                <Grid item key={index} xs={12} sm={6} lg={4}>
                    <RecipeCardSkeleton />
                </Grid>
            ))}
        </Grid>
    )
}

// Komponen utama halaman, sekarang tugasnya mengatur layout dan Suspense
export default function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={5}>
        <Grid item md={3} sx={{ display: { xs: "none", md: "block" } }}>
          <CategorySidebar />
        </Grid>

        <Grid item xs={12} md={9}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
            <Typography variant="h4" component="h1">
              Jelajahi Resep
            </Typography>
            <Box sx={{ display: { xs: "block", md: "none" }, width: "100%" }}>
              <CategoryDropdown />
            </Box>
            <SortFilter />
          </Box>
          
          <Suspense key={JSON.stringify(searchParams)} fallback={<RecipeListFallback />}>
            <RecipeList searchParams={searchParams} />
          </Suspense>
          
        </Grid>
      </Grid>
    </Container>
  );
}