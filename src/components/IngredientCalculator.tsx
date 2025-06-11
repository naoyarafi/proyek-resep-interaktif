'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemText, TextField, Grid } from '@mui/material';

// Definisikan tipe untuk props yang diterima
interface IngredientCalculatorProps {
  recipe: {
    mainIngredientUnit: string;
    mainIngredients: { name: string; defaultQuantity: number }[];
    complementaryIngredients: { name: string; quantityPerUnit: number; unit: string }[];
  };
}

export default function IngredientCalculator({ recipe }: IngredientCalculatorProps) {
  // State untuk menyimpan jumlah bahan utama yang diubah oleh pengguna.
  // Inisialisasi dengan nilai default dari resep.
  const [mainQuantities, setMainQuantities] = useState(() =>
    recipe.mainIngredients.map(ing => ing.defaultQuantity)
  );

  // Hitung total kuantitas default dari bahan utama (hanya dihitung sekali)
  const totalDefaultQuantity = useMemo(() =>
    recipe.mainIngredients.reduce((sum, ing) => sum + ing.defaultQuantity, 0)
  , [recipe.mainIngredients]);

  // Hitung total kuantitas saat ini berdasarkan input pengguna
  const currentTotalQuantity = mainQuantities.reduce((sum, qty) => sum + Number(qty), 0);
  
  // Hitung faktor pengali
  // Hindari pembagian dengan nol jika tidak ada bahan utama
  const multiplier = totalDefaultQuantity > 0 ? currentTotalQuantity / totalDefaultQuantity : 1;

  const handleQuantityChange = (index: number, value: string) => {
    const newQuantities = [...mainQuantities];
    newQuantities[index] = Number(value) || 0; // Ubah ke angka, default ke 0 jika tidak valid
    setMainQuantities(newQuantities);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Bahan-bahan</Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>Bahan Utama</Typography>
      <List dense>
        {recipe.mainIngredients.map((ing, index) => (
          <ListItem key={index}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <ListItemText primary={ing.name} />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  type="number"
                  size="small"
                  value={mainQuantities[index]}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  inputProps={{ min: 0, step: "0.1" }} // Atur properti input
                />
              </Grid>
              <Grid item xs={2}>
                 <Typography variant="body1">{recipe.mainIngredientUnit}</Typography>
              </Grid>
            </Grid>
          </ListItem>
        ))}
      </List>

      <Typography variant="h6" sx={{ mt: 2 }}>Bahan Pelengkap (Hasil Perhitungan)</Typography>
      <List dense>
        {recipe.complementaryIngredients.map((ing, index) => (
          <ListItem key={index}>
            {/* Kalikan jumlah asli dengan faktor pengali */}
            <ListItemText primary={`${ing.name} - ${(ing.quantityPerUnit * multiplier).toFixed(1)} ${ing.unit}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}