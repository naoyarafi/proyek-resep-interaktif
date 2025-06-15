import { Card, CardMedia, CardContent, Typography, Box, CardActionArea, Avatar } from "@mui/material";
import Link from "next/link";

// Definisikan tipe data untuk prop 'recipe' agar komponen kita type-safe
interface Recipe {
    _id: string;
    title: string;
    imageUrl: string;
    author?: {
        name: string;
        profilePictureUrl?: string;
    };
    category?: {
        name: string;
    };
}

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardActionArea component={Link} href={`/recipes/${recipe._id}`}>
        <CardMedia
          component="img"
          height="180"
          image={recipe.imageUrl}
          alt={recipe.title}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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
      </CardActionArea>
    </Card>
  );
}