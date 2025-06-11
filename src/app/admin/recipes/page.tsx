// src/app/admin/recipes/page.tsx

import dbConnect from '@/lib/dbConnect';
import Recipe from '@/models/Recipe.model';
import User from '@/models/User.model'; // Impor untuk populate
import Category from '@/models/Category.model'; // Impor untuk populate
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip, Box } from '@mui/material';
import RecipeActionButtons from '@/components/admin/RecipeActionButtons'; // Kita akan buat ini selanjutnya

async function getAllRecipes() {
  await dbConnect();
  const recipes = await Recipe.find({})
    .sort({ createdAt: -1 })
    .populate('author', 'name')
    .populate('category', 'name');
  return JSON.parse(JSON.stringify(recipes));
}

export default async function AdminRecipesPage() {
  const recipes = await getAllRecipes();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Manajemen Resep</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Judul Resep</TableCell>
              <TableCell>Penulis</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recipes.map((recipe: any) => (
              <TableRow key={recipe._id}>
                <TableCell>{recipe.title}</TableCell>
                <TableCell>{recipe.author?.name || 'N/A'}</TableCell>
                <TableCell>{recipe.category?.name || 'N/A'}</TableCell>
                <TableCell>
                  {recipe.isSuspended && <Chip label="Ditangguhkan" color="warning" size="small" />}
                </TableCell>
                <TableCell>
                  <RecipeActionButtons recipe={recipe} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}