import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { email } = await request.json();
    const user = await User.findOne({ email });

    // PENTING: Untuk keamanan, selalu kembalikan pesan sukses
    // meskipun email tidak ditemukan. Ini mencegah 'user enumeration'.
    if (!user) {
      return NextResponse.json({ message: 'Jika email terdaftar, link reset telah dikirim.' }, { status: 200 });
    }

    // 1. Buat token reset yang aman
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Token di-hash sebelum disimpan ke DB untuk keamanan ekstra
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 2. Set waktu kedaluwarsa (1 jam dari sekarang)
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 jam

    await user.save();

    // 3. Buat URL reset
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;


    // 4. Kirim email menggunakan Resend
    await resend.emails.send({
        from: 'noreply@resep-interaktif.com', // GANTI INI
        to: email,
        subject: 'Link Reset Password Akun Resep Anda',
        html: `<p>Anda meminta untuk me-reset password Anda. Silakan klik link di bawah ini untuk melanjutkan:</p><a href="${resetUrl}">Reset Password</a><p>Link ini hanya berlaku selama 1 jam.</p><p>Jika Anda tidak merasa meminta ini, abaikan email ini.</p>`
    });

    return NextResponse.json({ message: 'Jika email terdaftar, link reset telah dikirim.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error di forgot-password:', error);
    // Tetap kirim pesan generik untuk keamanan
    return NextResponse.json({ message: 'Terjadi kesalahan, coba lagi nanti.' }, { status: 500 });
  }
}