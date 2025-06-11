'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordSchema } from '@/lib/validationSchemas';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordSchema>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit: SubmitHandler<ResetPasswordSchema> = async (data) => {
        setError(null);
        setSuccess(null);
        if (!token) {
            setError('Token tidak ditemukan atau link tidak valid.');
            return;
        }
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: data.password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setSuccess(result.message);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan.');
        }
    };

    if (!token) {
        return <Alert severity="error" sx={{mt: 4}}>Link reset tidak valid atau tidak lengkap.</Alert>;
    }

    return (
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">Reset Password Baru</Typography>
            {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                <TextField margin="normal" required fullWidth label="Password Baru" type="password" id="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} disabled={isSubmitting || !!success} />
                <TextField margin="normal" required fullWidth label="Konfirmasi Password Baru" type="password" id="confirmPassword" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} disabled={isSubmitting || !!success} />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isSubmitting || !!success}>
                    {isSubmitting ? 'Menyimpan...' : 'Reset Password'}
                </Button>
            </Box>
        </Box>
    );
}

export default function ResetPasswordPage() {
    return (
        <Container component="main" maxWidth="xs">
             <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>}>
                <ResetPasswordForm />
            </Suspense>
        </Container>
    )
}