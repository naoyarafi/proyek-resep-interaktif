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
/**
 * Fungsi ini berjalan di server untuk mengambil data resep dari API kita.
 * Ia menerima searchParams untuk membangun URL query yang dinamis.
 */
async function getRecipes(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  // URL dasar API
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? `https://YOUR_PRODUCTION_URL` // Ganti ini dengan URL produksi Anda nanti
      : "http://localhost:3000";

  // Membuat query string (e.g., "?search=ayam&category=Makanan+Utama")
  const query = new URLSearchParams(
    searchParams as Record<string, string>
  ).toString();

  try {
    // Fetch data dengan cache 'no-store' untuk selalu mendapatkan data terbaru
    const res = await fetch(`${apiUrl}/api/recipes?${query}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      // Jika respons tidak ok, lemparkan error untuk ditangkap oleh blok catch
      const errorData = await res.text();
      console.error("Gagal mengambil data resep, respons server:", errorData);
      throw new Error("Gagal mengambil data resep dari server");
    }

    const data = await res.json();
    return data.data || []; // Kembalikan array resep, atau array kosong jika tidak ada data
  } catch (error) {
    console.error("Error saat fetching resep:", error);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

/**
 * Ini adalah Server Component. Ia menerima `searchParams` dari URL secara otomatis sebagai props.
 * Contoh: Jika URL adalah /?search=soto, maka searchParams akan berisi { search: 'soto' }.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const recipes = await getRecipes(searchParams);

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={5}>
        {/* Kolom Kiri: Sidebar Kategori */}
        <Grid item xs={12} md={3}>
          <CategorySidebar />
        </Grid>

        {/* Kolom Kanan: Daftar Resep */}
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
                    {/* Membuat seluruh kartu bisa diklik dan mengarah ke halaman detail */}
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
                            // Trik untuk membatasi judul menjadi 2 baris
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
              // Tampilan jika tidak ada resep yang ditemukan
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
        </Grid>
      </Grid>
    </Container>
  );
}
