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

    // 2. Ambil data baru dari body
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Nama tidak boleh kosong' }, { status: 400 });
    }

    // 3. Update nama pengguna di database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: name },
      { new: true } // Opsi ini mengembalikan dokumen yang sudah terupdate
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // 4. Buat accessToken BARU dengan nama yang sudah diupdate
    const newAccessTokenPayload = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    };
    const newAccessToken = await new SignJWT(newAccessTokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION!)
        .sign(secret);

    // 5. Kirim kembali data user yang sudah diupdate DAN accessToken yang baru
    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      accessToken: newAccessToken,
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui profil', error: error.message }, { status: 500 });
  }
}