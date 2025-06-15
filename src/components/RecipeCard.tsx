import { Card, CardMedia, CardContent, Typography, Box, CardActionArea, Avatar, IconButton } from "@mui/material";
import Link from "next/link";
import WishlistButton from "./WishlistButton"; // Impor tombol wishlist

interface Recipe {
    _id: string;
    title: string;
    imageUrl: string;
    author?: {
        _id: string; // Tambahkan _id author
        name: string;
        profilePictureUrl?: string;
    };
    category?: {
        name: string;
    };
}

interface RecipeCardProps {
  recipe: Recipe;
  initialWishlist: string[]; // <-- Prop baru untuk menampung data wishlist
}

export default function RecipeCard({ recipe, initialWishlist }: RecipeCardProps) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: 'relative' }}>
        {/* Tombol Wishlist diletakkan di atas gambar */}
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
          variant="h6" // Ukuran dikecilkan sedikit agar pas
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
        </Box>
      </CardContent>
    </Card>
  );
}