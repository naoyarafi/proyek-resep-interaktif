import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { token, password } = await request.json();

    // 1. Hash token yang masuk dari URL agar cocok dengan yang ada di DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. Cari user berdasarkan hashed token DAN pastikan token belum kedaluwarsa
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // $gt = greater than (lebih besar dari)
    });

    if (!user) {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kedaluwarsa.' }, { status: 400 });
    }

    // 3. Jika user ditemukan, hash password baru
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(password, salt);

    // 4. Hapus token reset dari database agar tidak bisa digunakan lagi
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return NextResponse.json({ success: true, message: 'Password berhasil direset. Silakan login.' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal me-reset password.', error: error.message }, { status: 500 });
  }
}