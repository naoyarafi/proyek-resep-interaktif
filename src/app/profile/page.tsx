'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
// Hapus impor IRecipe dari model
import { Container, Typography, Box, Paper, Grid, Card, CardActionArea, CardMedia, CardContent, CircularProgress, Avatar, Button, TextField, Alert } from '@mui/material';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
export const dynamic = 'force-dynamic';

// ===== BAGIAN BARU 1: DEFINISIKAN TIPE KHUSUS UNTUK FRONTEND =====
// Tipe ini mendeskripsikan bentuk data JSON yang kita terima dari API
type RecipeForProfile = {
  _id: string; // _id sekarang adalah string
  title: string;
  imageUrl: string;
  category?: { // Kategori bisa jadi null jika sudah dihapus
    _id: string;
    name: string;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, accessToken, setAuthData } = useAuthStore();

  // Gunakan tipe baru untuk state kita
  const [myRecipes, setMyRecipes] = useState<RecipeForProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchMyRecipes = async () => {
      if (!accessToken) return;
      try {
        const res = await authFetch('/api/users/me/recipes', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setMyRecipes(data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil resep saya:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyRecipes();
  }, [user, accessToken, router]);
  
  const handleUpdateProfile = async () => {
    setError(null);
    if(!newName.trim()){
        setError("Nama tidak boleh kosong.");
        return;
    }
    try {
        const res = await authFetch('/api/users/me/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken!}`},
            body: JSON.stringify({ name: newName }),
        });
        const result = await res.json();
        if(!res.ok) throw new Error(result.message);

        setAuthData({ user: result.user, accessToken: result.accessToken });
        setIsEditing(false);
        
    } catch (err: any) {
        setError(err.message);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Bagian Header Profil */}
      <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 4, mb: 4 }}>
        <Avatar sx={{ width: 100, height: 100, fontSize: '3rem' }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          {isEditing ? (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
              <TextField 
                label="Nama Baru"
                defaultValue={user.name}
                onChange={(e) => setNewName(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Button type="submit" sx={{ ml: 1 }} variant="contained">Simpan</Button>
              <Button sx={{ ml: 1 }} onClick={() => setIsEditing(false)}>Batal</Button>
            </Box>
          ) : (
            <>
              <Typography variant="h4" component="h1">{user.name}</Typography>
              <Typography variant="body1" color="text.secondary">{user.email}</Typography>
              <Button sx={{ mt: 1 }} variant="outlined" size="small" onClick={() => { setIsEditing(true); setNewName(user.name); }}>
                Edit Profil
              </Button>
            </>
          )}
           {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
      </Paper>

      {/* Bagian Daftar Resep */}
      <Typography variant="h5" component="h2" gutterBottom>Resep Saya</Typography>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={4}>
          {myRecipes.length > 0 ? (
            // ===== BAGIAN YANG DIPERBAIKI 2: TIPE `recipe` SEKARANG SUDAH BENAR =====
            myRecipes.map((recipe) => (
              <Grid item key={recipe._id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea component={Link} href={`/recipes/${recipe._id}`}>
                    <CardMedia component="img" height="140" image={recipe.imageUrl} alt={recipe.title} />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="h3">{recipe.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kategori: {recipe.category?.name || 'N/A'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography sx={{ ml: 2, mt: 2 }}>Anda belum membuat resep apapun.</Typography>
          )}
        </Grid>
      )}
    </Container>
  );
}