'use client';

import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, TextField, InputAdornment, IconButton, Avatar, Menu, MenuItem, useMediaQuery, useTheme, Divider } from '@mui/material';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close'; // Impor ikon close
import NotificationBell from './NotificationBell';
import MenuIcon from '@mui/icons-material/Menu';

// Komponen SearchBar dibuat lebih fleksibel
function SearchBar({ onSearchSubmit }: { onSearchSubmit?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    } else {
      params.delete('search');
    }
    
    router.push(`/?${params.toString()}`);
    onSearchSubmit?.();
  };
  
  // SearchBar hanya akan dirender jika kita berada di halaman utama
  if (pathname !== '/') {
    return null;
  }

  return (
    <Box component="form" onSubmit={handleSearch} sx={{ width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        name="search"
        placeholder="Cari resep..."
        autoFocus
        defaultValue={searchParams.get('search') || ''}
        sx={{
          '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255, 255, 255, 0.15)', borderRadius: 1 },
          '& .MuiOutlinedInput-input': { color: 'white' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.25)' },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton type="submit" size="small" edge="end">
                <SearchIcon sx={{ color: 'white' }} />
              </IconButton>
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // State untuk search mobile

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    handleMobileMenuClose();
    try {
      await fetch('/api/auth/logout');
      clearAuthData();
      router.push('/login');
    } catch (error) {
      console.error('Gagal melakukan logout:', error);
    }
  };
  
  const handleAddRecipeClick = () => {
    handleMobileMenuClose();
    if (user) {
      router.push('/recipes/add');
    } else {
      router.push('/login');
    }
  };

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: '45px' }}
    >
      {user ? (
        <div>
          <MenuItem onClick={handleAddRecipeClick}>Tambah Resep</MenuItem>
          <MenuItem onClick={() => { router.push('/profile'); handleMobileMenuClose(); }}>Profil Saya</MenuItem>
          <MenuItem onClick={() => { router.push('/wishlist'); handleMobileMenuClose(); }}>Wishlist</MenuItem>
          {user.role === 'admin' && <MenuItem onClick={() => { router.push('/admin/users'); handleMobileMenuClose(); }}>Panel Admin</MenuItem>}
          <Divider />
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </div>
      ) : (
        <div>
          <MenuItem onClick={() => { router.push('/login'); handleMobileMenuClose(); }}>Login</MenuItem>
          <MenuItem onClick={() => { router.push('/register'); handleMobileMenuClose(); }}>Register</MenuItem>
        </div>
      )}
    </Menu>
  );

  const renderDesktopMenu = (
     <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose} sx={{ mt: '45px' }}>
      <MenuItem component={Link} href="/wishlist" onClick={handleMenuClose}>Resep Tersimpan</MenuItem>
        {user?.role === 'admin' && <MenuItem component={Link} href="/admin/users" onClick={handleMenuClose}>Panel Admin</MenuItem>}
        <MenuItem component={Link} href="/profile" onClick={handleMenuClose}>Profil Saya</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
     </Menu>

  );

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Tampilan Desktop (dan mobile default) */}
        {!mobileSearchOpen && (
           <Typography variant="h6" component="div" sx={{ flexGrow: { xs: 1, md: 0 }, mr: { xs: 0, md: 2} }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>ResepKuy</Link>
          </Typography>
        )}
        
        {/* Spacer untuk mendorong item ke kanan */}
        {!isMobile && <Box sx={{ flexGrow: 1 }} />}

        {/* Search Bar untuk Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, width: '30%' }}>
            <SearchBar />
        </Box>

        {/* Tampilan Mobile saat Search Terbuka */}
        {isMobile && mobileSearchOpen && (
            <Box sx={{ width: '100%', ml: 1 }}>
                <SearchBar onSearchSubmit={() => setMobileSearchOpen(false)} />
            </Box>
        )}
        
        <Box sx={{ flexGrow: 1 }} />

        {/* Tampilan Desktop - Tombol Aksi */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {user ? (
                <>
                    <Button variant="contained" color="secondary" onClick={handleAddRecipeClick}>Tambah Resep</Button>
                    <NotificationBell />
                    <IconButton onClick={handleProfileMenuOpen} size="small">
                        <Avatar sx={{ width: 32, height: 32 }} src={user.profilePictureUrl || undefined}>
                            {!user.profilePictureUrl && user.name.charAt(0).toUpperCase()}
                        </Avatar>
                    </IconButton>
                </>
            ) : (
                <>
                    <Button component={Link} href="/login" color="inherit">Login</Button>
                    <Button component={Link} href="/register" color="inherit">Register</Button>
                </>
            )}
        </Box>
        
        {/* Tampilan Mobile - Tombol Aksi */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            {user && <NotificationBell />}

            {!mobileSearchOpen && (
                <IconButton color="inherit" onClick={() => setMobileSearchOpen(true)}>
                    <SearchIcon />
                </IconButton>
            )}

            <IconButton size="large" color="inherit" onClick={handleMobileMenuOpen}>
                <MenuIcon />
            </IconButton>
        </Box>
      </Toolbar>
      {renderDesktopMenu}
      {renderMobileMenu}
    </AppBar>
  );
}