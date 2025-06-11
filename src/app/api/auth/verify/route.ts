import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { email, code } = await request.json();

    // Cari user berdasarkan email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Cek apakah akun sudah terverifikasi sebelumnya
    if (user.isVerified) {
        return NextResponse.json({ message: 'Akun ini sudah terverifikasi.' }, { status: 400 });
    }

    // Cocokkan kode verifikasi
    const isCodeCorrect = user.verifyCode === code;
    if (!isCodeCorrect) {
      return NextResponse.json({ message: 'Kode verifikasi salah.' }, { status: 400 });
    }

    // Cek apakah kode sudah kedaluwarsa
    const isCodeExpired = new Date(user.verifyCodeExpiry) < new Date();
    if (isCodeExpired) {
      return NextResponse.json({ message: 'Kode verifikasi sudah kedaluwarsa. Silakan daftar ulang untuk mendapatkan kode baru.' }, { status: 400 });
    }

    // Jika semua pemeriksaan lolos, verifikasi user
    user.isVerified = true;
    await user.save();

    return NextResponse.json(
      { message: 'Verifikasi akun berhasil! Anda sekarang bisa login.', success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saat verifikasi:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat verifikasi.' }, { status: 500 });
  }
}