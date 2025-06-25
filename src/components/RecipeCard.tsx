import { Card, CardMedia, CardContent, Typography, Box, CardActionArea, Avatar, IconButton } from "@mui/material";
import Link from "next/link";
import WishlistButton from "./WishlistButton";

// Definisikan tipe data untuk prop 'recipe'
interface Recipe {
    _id: string;
    title: string;
    imageUrl: string;
    author?: {
        _id: string;
        name: string;
        profilePictureUrl?: string;
    };
    category?: {
        name: string;
    };
    createdAt: string; // <-- 1. Tambahkan createdAt di sini
}

interface RecipeCardProps {
  recipe: Recipe;
  initialWishlist: string[];
}

export default function RecipeCard({ recipe, initialWishlist }: RecipeCardProps) {
  // 2. Buat format tanggal yang mudah dibaca
  const formattedDate = new Date(recipe.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%' }}>
          <WishlistButton recipeId={recipe._id} initialWishlist={initialWishlist} />
        </Box>
        <CardActionArea component={Link} href={`/recipes/${recipe._id}`}>
          <CardMedia
            component="img"
            height="180"
            image={recipe.imageUrl}
            alt={recipe.title}
          />
        </CardActionArea>
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          gutterBottom
          variant="h6"
          component="h3"
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
          <Typography variant="body2" color="text.secondary" noWrap>
            Kategori: {recipe.category?.name || "N/A"}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Avatar
              sx={{ width: 24, height: 24, mr: 1 }}
              src={recipe.author?.profilePictureUrl || undefined}
            >
              {!recipe.author?.profilePictureUrl && recipe.author?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {recipe.author?.name || "Anonim"}
            </Typography>
          </Box>
          {/* ===== 3. TAMBAHKAN TAMPILAN TANGGAL DI SINI ===== */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Dibuat pada {formattedDate}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}