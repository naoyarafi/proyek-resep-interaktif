import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CardActionArea,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import CategorySidebar from "@/components/CategorySidebar"; // Impor komponen sidebar
import SortFilter from "@/components/SortFilter";
import PaginationControl from "@/components/PaginationControl";
import CategoryDropdown from "@/components/CategoryDropdown";

export const dynamic = "force-dynamic";

/**
 * Fungsi ini berjalan di server untuk mengambil data resep dari API kita.
 * Ia menerima searchParams untuk membangun URL query yang dinamis.
 */
async function getRecipes(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  // Saat di server (seperti Vercel), kita bisa langsung tahu URL kita sendiri.
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000";
  const query = new URLSearchParams(
    searchParams as Record<string, string>
  ).toString();

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
    return {
      success: false,
      data: [],
      pagination: { totalPages: 0, currentPage: 1 },
    };
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
        {/* ===== PERUBAHAN DI SINI ===== */}
        {/* Kolom Kiri: Sidebar Kategori untuk Desktop */}
        <Grid item md={3} sx={{ display: { xs: "none", md: "block" } }}>
          <CategorySidebar />
        </Grid>

        {/* Kolom Kanan: Daftar Resep */}
        <Grid item xs={12} md={9}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" }, // Tampilan beda di mobile
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              gap: 2, // Beri jarak antar item
            }}
          >
            <Typography variant="h4" component="h1">
              Jelajahi Resep
            </Typography>
            {/* Dropdown Kategori untuk Mobile */}
            <Box sx={{ display: { xs: "block", md: "none" }, width: "100%" }}>
              <CategoryDropdown />
            </Box>
            <SortFilter />
          </Box>
          {/* ============================== */}
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
                        <Box sx={{ mt: "auto", pt: 1 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            Kategori: {recipe.category?.name || "N/A"}
                          </Typography>
                          {/* Box untuk menyejajarkan Avatar dan Nama Penulis */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Avatar
                              sx={{ width: 24, height: 24, mr: 1 }}
                              src={
                                recipe.author?.profilePictureUrl || undefined
                              }
                            >
                              {/* Fallback jika tidak ada foto, tampilkan inisial */}
                              {!recipe.author?.profilePictureUrl &&
                                recipe.author?.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {recipe.author?.name || "Anonim"}
                            </Typography>
                          </Box>
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              mt: 5,
            }}
          >
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
