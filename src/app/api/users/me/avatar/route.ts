import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { jwtVerify, SignJWT } from 'jose';

export async function PATCH(request: NextRequest) {
  await dbConnect();
  try {
    // 1. Verifikasi token untuk mendapatkan ID pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Ambil URL gambar baru dari body
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ message: 'URL Gambar dibutuhkan' }, { status: 400 });
    }

    // 3. Update URL foto profil di database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePictureUrl: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // 4. Buat ulang accessToken dengan profilePictureUrl yang baru
    // Ini penting agar avatar di Navbar bisa langsung update
    const newAccessTokenPayload = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePictureUrl: updatedUser.profilePictureUrl, // Sertakan URL baru
    };
    const newAccessToken = await new SignJWT(newAccessTokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION!)
      .sign(secret);

    // 5. Kirim kembali data user dan token baru
    return NextResponse.json({
      success: true,
      message: 'Foto profil berhasil diperbarui',
      user: newAccessTokenPayload,
      accessToken: newAccessToken,
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui foto profil', error: error.message }, { status: 500 });
  }
}