import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CardActionArea,
} from "@mui/material";
import Link from "next/link";
import CategorySidebar from "@/components/CategorySidebar"; // Impor komponen sidebar
import SortFilter from "@/components/SortFilter";
import PaginationControl from '@/components/PaginationControl'; 

export const dynamic = 'force-dynamic';

/**
 * Fungsi ini berjalan di server untuk mengambil data resep dari API kita.
 * Ia menerima searchParams untuk membangun URL query yang dinamis.
 */
async function getRecipes(searchParams: { [key: string]: string | string[] | undefined }) {
  // Saat di server (seperti Vercel), kita bisa langsung tahu URL kita sendiri.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';
  const query = new URLSearchParams(searchParams as Record<string, string>).toString();

  try {
    // Fetch data dengan cache 'no-store' untuk selalu mendapatkan data terbaru
    const res = await fetch(`${baseUrl}/api/recipes?${query}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Gagal mengambil data resep, respons server:", errorData);
      throw new Error("Gagal mengambil data resep dari server");
    }

    // ===== PERUBAHAN 1: KEMBALIKAN SELURUH OBJEK JSON DARI API =====
    return await res.json(); 
    
  } catch (error) {
    console.error("Error saat fetching resep:", error);
    // Kembalikan struktur data default jika terjadi error
    return { success: false, data: [], pagination: { totalPages: 0, currentPage: 1 } }; 
  }
}

/**
 * Ini adalah Server Component. Ia menerima `searchParams` dari URL secara otomatis sebagai props.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // ===== PERUBAHAN 2: DESTRUCTURE `data` DAN `pagination` DARI HASIL FETCH =====
  // `data` kita beri nama alias `recipes` agar sisa kode tidak perlu diubah
  const { data: recipes, pagination } = await getRecipes(searchParams);

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={5}>
        <Grid item xs={12} md={3}>
          <CategorySidebar />
        </Grid>

        <Grid item xs={12} md={9}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h4" component="h1">
              Jelajahi Resep
            </Typography>
            <SortFilter />
          </Box>
          <Grid container spacing={4}>
            {recipes && recipes.length > 0 ? (
              recipes.map((recipe: any) => (
                <Grid item key={recipe._id} xs={12} sm={6} lg={4}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardActionArea
                      component={Link}
                      href={`/recipes/${recipe._id}`}
                    >
                      <CardMedia
                        component="img"
                        height="180"
                        image={recipe.imageUrl}
                        alt={recipe.title}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          gutterBottom
                          variant="h5"
                          component="h2"
                          sx={{
                            display: "-webkit-box",
                            overflow: "hidden",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                          }}
                        >
                          {recipe.title}
                        </Typography>
                        <Box
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.875rem",
                            mt: "auto",
                          }}
                        >
                          <Typography component="span" variant="body2">
                            Kategori: {recipe.category?.name || "N/A"}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            Oleh: {recipe.author?.name || "Anonim"}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography
                  align="center"
                  sx={{ mt: 4, color: "text.secondary" }}
                >
                  Tidak ada resep yang cocok dengan pencarian Anda.
                </Typography>
              </Grid>
            )}
          </Grid>

          {/* ===== BAGIAN BARU: Tambahkan Paginasi di Sini ===== */}
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 5 }}>
            <PaginationControl 
              totalPages={pagination?.totalPages || 0} 
              currentPage={pagination?.currentPage || 1} 
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}