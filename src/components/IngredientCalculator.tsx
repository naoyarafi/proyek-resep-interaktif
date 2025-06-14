'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemText, TextField, Grid } from '@mui/material';

// Definisikan tipe untuk props yang diterima
interface IngredientCalculatorProps {
  recipe: {
    mainIngredientUnit: string;
    mainIngredients: { name: string; defaultQuantity: number }[];
    complementaryIngredients: { name: string; quantityPerUnit: number; unit: string }[];
  };
}

// ===== 1. FUNGSI HELPER BARU UNTUK FORMAT ANGKA =====
const formatQuantity = (num: number): string => {
  // Trik untuk menghilangkan .0 dari angka bulat (e.g., 2.0 -> 2)
  // dan mempertahankan desimal jika ada (e.g., 1.5 -> 1.5)
  // .toFixed(2) untuk membatasi maksimal 2 angka desimal
  return Number(num.toFixed(2)).toString();
};

export default function IngredientCalculator({ recipe }: IngredientCalculatorProps) {
  const [mainQuantities, setMainQuantities] = useState(() =>
    recipe.mainIngredients.map(ing => ing.defaultQuantity)
  );

  const totalDefaultQuantity = useMemo(() =>
    recipe.mainIngredients.reduce((sum, ing) => sum + ing.defaultQuantity, 0)
  , [recipe.mainIngredients]);

  const currentTotalQuantity = mainQuantities.reduce((sum, qty) => sum + Number(qty), 0);
  
  const multiplier = totalDefaultQuantity > 0 ? currentTotalQuantity / totalDefaultQuantity : 1;

  const handleQuantityChange = (index: number, value: string) => {
    const newQuantities = [...mainQuantities];
    newQuantities[index] = Number(value) || 0;
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
                  // ===== 2. UBAH inputProps AGAR BISA DESIMAL =====
                  inputProps={{ min: 0, step: "any" }} 
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
            {/* ===== 3. GUNAKAN FUNGSI formatQuantity DI SINI ===== */}
            <ListItemText primary={`${ing.name} - ${formatQuantity(ing.quantityPerUnit * multiplier)} ${ing.unit}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}