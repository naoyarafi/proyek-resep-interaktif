'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifySchema, VerifySchema } from '@/lib/validationSchemas';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifySchema>({
        resolver: zodResolver(verifySchema),
    });

    const onSubmit: SubmitHandler<VerifySchema> = async (data) => {
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: data.code }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            setSuccess(result.message);
            setTimeout(() => router.push('/login'), 2000);

        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan.');
        }
    };

    if (!email) {
        return <Container><Typography>Email tidak ditemukan. Silakan kembali ke halaman registrasi.</Typography></Container>;
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Verifikasi Email Anda</Typography>
                <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    Kami telah mengirimkan kode verifikasi 6 digit ke **{email}**.
                </Typography>

                {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="code"
                        label="Kode Verifikasi 6 Digit"
                        autoFocus
                        {...register('code')}
                        error={!!errors.code}
                        helperText={errors.code?.message}
                        disabled={isSubmitting || !!success}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isSubmitting || !!success}>
                        {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}