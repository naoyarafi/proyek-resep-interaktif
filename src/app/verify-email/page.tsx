'use client';

export const dynamic = 'force-dynamic';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifySchema, VerifySchema } from '@/lib/validationSchemas';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react'; // Impor Suspense
import { Container, Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';


// Komponen ini berisi logika yang menggunakan useSearchParams
function VerifyEmailForm() {
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
        return <Alert severity="error">Email tidak ditemukan di URL. Silakan kembali ke halaman registrasi.</Alert>;
    }

    return (
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">Verifikasi Email Anda</Typography>
            <Typography sx={{ mt: 2, textAlign: 'center' }}>
                Kami telah mengirimkan kode verifikasi 6 digit ke <strong>{email}</strong>.
            </Typography>
            {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                <TextField margin="normal" required fullWidth id="code" label="Kode Verifikasi 6 Digit" autoFocus {...register('code')} error={!!errors.code} helperText={errors.code?.message} disabled={isSubmitting || !!success} />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isSubmitting || !!success}>
                    {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
                </Button>
            </Box>
        </Box>
    );
}

// Komponen utama sekarang hanya bertugas sebagai wrapper Suspense
export default function VerifyEmailPage() {
    return (
        <Container component="main" maxWidth="xs">
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>}>
                <VerifyEmailForm />
            </Suspense>
        </Container>
    );
}