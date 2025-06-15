// src/components/RecipeDetailSkeleton.tsx
import { Container, Skeleton, Box, Paper } from '@mui/material';

export default function RecipeDetailSkeleton() {
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
                <Skeleton variant="text" sx={{ fontSize: '2rem' }} width="80%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rectangular" width="100%" height={400} sx={{ my: 3, borderRadius: 2 }} />
                <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} width="50%" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="90%" />
            </Paper>
        </Container>
    )
}