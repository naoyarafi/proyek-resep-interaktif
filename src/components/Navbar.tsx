"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import NotificationBell from "./NotificationBell";
import { useState } from "react";

export const dynamic = "force-dynamic";

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get("search") as string;
    // Buat query baru sambil mempertahankan parameter lain (jika ada)
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", searchQuery.trim());
    router.push(`/?${params.toString()}`);
  };

  return (
    <Box component="form" onSubmit={handleSearch} sx={{ ml: 2, mr: 2 }}>
      <TextField
        size="small"
        variant="outlined"
        name="search"
        placeholder="Cari resep..."
        defaultValue={searchParams.get("search") || ""}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "rgba(255, 255, 255, 0.15)",
            borderRadius: 1,
          },
          "& .MuiOutlinedInput-input": { color: "white" },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "white" }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}

export default function Navbar() {
  const { user, clearAuthData } = useAuthStore();
  const router = useRouter();

  // ===== STATE BARU UNTUK MENGONTROL MENU PROFIL =====
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose(); // Tutup menu dulu
    try {
      await fetch("/api/auth/logout");
      clearAuthData();
      router.push("/login");
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            Resep Interaktif
          </Link>
        </Typography>

        <SearchBar />
        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {user ? (
            // --- TAMPILAN JIKA USER SUDAH LOGIN (DIPERBARUI) ---
            <>
              <NotificationBell />
              <IconButton onClick={handleMenu} size="small">
                <Avatar
                  sx={{ width: 32, height: 32 }}
                  src={user.profilePictureUrl || undefined}
                >
                  {/* Jika tidak ada foto, tampilkan inisial */}
                  {!user.profilePictureUrl && user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                keepMounted
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={open}
                onClose={handleClose}
              >
                {/* Link menu akan berbeda berdasarkan role */}
                {user.role === "admin" && (
                  <MenuItem
                    component={Link}
                    href="/admin/users"
                    onClick={handleClose}
                  >
                    Panel Admin
                  </MenuItem>
                )}
                <MenuItem
                  component={Link}
                  href="/profile"
                  onClick={handleClose}
                >
                  Profil Saya
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            // --- TAMPILAN JIKA USER BELUM LOGIN ---
            <>
              <Button component={Link} href="/login" color="inherit">
                Login
              </Button>
              <Button component={Link} href="/register" color="inherit">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
