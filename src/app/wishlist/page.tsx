'use client';
import { useEffect, useState } from 'react';
import { Container, Typography, Grid, CircularProgress, Box } from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import RecipeCard from '@/components/RecipeCard'; // Kita akan buat komponen ini

// Tipe untuk resep yang dipopulate
interface WishlistRecipe {
    _id: string;
    title: string;
    imageUrl: string;
    author: { _id: string, name: string };
    category: { _id: string, name: string };
}

export default function WishlistPage() {
    const { user, accessToken } = useAuthStore();
    const router = useRouter();
    const [wishlist, setWishlist] = useState<WishlistRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        const fetchWishlist = async () => {
            try {
                const res = await fetch('/api/users/me/wishlist', {
                    headers: { 'Authorization': `Bearer ${accessToken!}` }
                });
                const data = await res.json();
                if (data.success) {
                    setWishlist(data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWishlist();
    }, [user, accessToken, router]);

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>Wishlist Resep Saya</Typography>
            <Grid container spacing={4}>
                {wishlist.length > 0 ? (
                    wishlist.map(recipe => (
                        <Grid item key={recipe._id} xs={12} sm={6} md={4}>
                            <RecipeCard recipe={recipe} />
                        </Grid>
                    ))
                ) : (
                    <Typography sx={{ ml: 2 }}>Anda belum menyimpan resep apapun.</Typography>
                )}
            </Grid>
        </Container>
    );
}