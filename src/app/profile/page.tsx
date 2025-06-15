"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
// Hapus impor IRecipe dari model
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  CircularProgress,
  Avatar,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";
export const dynamic = "force-dynamic";

// ===== BAGIAN BARU 1: DEFINISIKAN TIPE KHUSUS UNTUK FRONTEND =====
// Tipe ini mendeskripsikan bentuk data JSON yang kita terima dari API
type RecipeForProfile = {
  _id: string; // _id sekarang adalah string
  title: string;
  imageUrl: string;
  category?: {
    // Kategori bisa jadi null jika sudah dihapus
    _id: string;
    name: string;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, accessToken, setAuthData } = useAuthStore();

  const [myRecipes, setMyRecipes] = useState<any[]>([]); // Ganti ke any untuk sementara
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [error, setError] = useState<string | null>(null);

  // State dan Ref untuk upload avatar
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchMyRecipes = async () => {
      if (!accessToken) return;
      try {
        const res = await authFetch("/api/users/me/recipes", {
          headers: { Authorization: `Bearer ${accessToken}` },
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

  const handleDeleteAvatar = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus foto profil?")) return;

    try {
      const res = await fetch("/api/users/me/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken!}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      // Perbarui state Zustand dengan data dan token baru dari API
      setAuthData({ user: result.user, accessToken: result.accessToken });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateProfile = async () => {
    setError(null);
    if (!newName.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    try {
      const res = await authFetch("/api/users/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken!}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setAuthData({ user: result.user, accessToken: result.accessToken });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !accessToken) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload file ke Vercel Blob via API /api/upload
      const uploadResponse = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        }
      );
      if (!uploadResponse.ok) throw new Error("Gagal meng-upload gambar.");
      const newBlob = await uploadResponse.json();

      // 2. Kirim URL gambar ke API untuk update profil
      const updateResponse = await fetch("/api/users/me/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ imageUrl: newBlob.url }),
      });
      const result = await updateResponse.json();
      if (!updateResponse.ok) throw new Error(result.message);

      // 3. Perbarui state Zustand dengan data dan token baru
      setAuthData({ user: result.user, accessToken: result.accessToken });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Bagian Header Profil */}
      <Paper
        elevation={3}
        sx={{ p: 3, display: "flex", alignItems: "center", gap: 4, mb: 4 }}
      >
        <Box sx={{ position: "relative" }}>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={avatarFileRef}
            onChange={handleAvatarChange}
          />
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: "3rem",
              cursor: "pointer",
            }}
            src={user.profilePictureUrl || undefined}
            onClick={() => avatarFileRef.current?.click()}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          {isUploading && (
            <CircularProgress
              size={110}
              sx={{ position: "absolute", top: -5, left: -5, zIndex: 1 }}
            />
          )}
        </Box>
        <Box>
          {isEditing ? (
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProfile();
              }}
            >
              <TextField
                label="Nama Baru"
                defaultValue={user.name}
                onChange={(e) => setNewName(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Button type="submit" sx={{ ml: 1 }} variant="contained">
                Simpan
              </Button>
              <Button sx={{ ml: 1 }} onClick={() => setIsEditing(false)}>
                Batal
              </Button>
            </Box>
          ) : (
            <>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  // Aturan untuk layar extra small (xs) ke atas
                  fontSize: { xs: "1.0rem", sm: "2.125rem" },
                  // Memaksa teks untuk pindah baris jika terlalu panjang
                  wordBreak: "break-word",
                }}
              >
                {user.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user.email}
              </Typography>
              <Button
                sx={{ mt: 1 }}
                variant="outlined"
                size="small"
                onClick={() => {
                  setIsEditing(true);
                  setNewName(user.name);
                }}
              >
                Edit Profil
              </Button>
              {/* Tombol Hapus Foto, hanya muncul jika ada foto */}
              {user.profilePictureUrl && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleDeleteAvatar}
                >
                  Hapus Foto
                </Button>
              )}
            </>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Bagian Daftar Resep */}
      <Typography variant="h5" component="h2" gutterBottom>
        Resep Saya
      </Typography>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={4}>
          {myRecipes.length > 0 ? (
            // ===== BAGIAN YANG DIPERBAIKI 2: TIPE `recipe` SEKARANG SUDAH BENAR =====
            myRecipes.map((recipe) => (
              <Grid item key={recipe._id} xs={12} sm={6} md={4}>
                <Card sx={{ height: "100%" }}>
                  <CardActionArea
                    component={Link}
                    href={`/recipes/${recipe._id}`}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={recipe.imageUrl}
                      alt={recipe.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="h3">
                        {recipe.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kategori: {recipe.category?.name || "N/A"}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography sx={{ ml: 2, mt: 2 }}>
              Anda belum membuat resep apapun.
            </Typography>
          )}
        </Grid>
      )}
    </Container>
  );
}
