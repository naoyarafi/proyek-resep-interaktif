// src/components/RecipeCardSkeleton.tsx
import { Card, CardContent, Skeleton, Box } from '@mui/material';

export default function RecipeCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height={180} />
      <CardContent>
        <Skeleton variant="text" sx={{ fontSize: '1.25rem' }} />
        <Skeleton variant="text" width="60%" />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton variant="text" width="80%" />
        </Box>
      </CardContent>
    </Card>
  );
}