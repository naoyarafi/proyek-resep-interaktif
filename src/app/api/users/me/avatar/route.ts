import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { jwtVerify, SignJWT } from 'jose';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Handler untuk MENGGANTI / UPDATE foto profil
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

    // ===== BAGIAN YANG DIPERBAIKI: HAPUS GAMBAR LAMA =====
    // 3. Cari user TERLEBIH DAHULU untuk mendapatkan URL foto lama
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }
    const oldImageUrl = user.profilePictureUrl;

    // 4. Update URL foto profil di database
    user.profilePictureUrl = imageUrl;
    const updatedUser = await user.save();

    // 5. Hapus file lama dari Vercel Blob JIKA ADA
    if (oldImageUrl) {
        try {
            await del(oldImageUrl);
        } catch (blobError) {
            // Jangan gagalkan seluruh proses jika hanya hapus file lama yang gagal
            console.error("Gagal menghapus avatar lama dari Vercel Blob:", blobError);
        }
    }
    // ========================================================

    // 6. Buat ulang accessToken dengan profilePictureUrl yang baru
    const newAccessTokenPayload = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePictureUrl: updatedUser.profilePictureUrl,
    };
    const newAccessToken = await new SignJWT(newAccessTokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION!)
      .sign(secret);

    // 7. Kirim kembali data user dan token baru
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

// Handler untuk MENGHAPUS foto profil
export async function DELETE(request: NextRequest) {
  await dbConnect();
  try {
    // 1. Verifikasi token pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Cari user dan simpan URL foto lama
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }
    const oldImageUrl = user.profilePictureUrl;

    // 3. Hapus URL dari database
    user.profilePictureUrl = undefined;
    await user.save();

    // 4. Hapus file lama dari Vercel Blob jika ada
    if (oldImageUrl) {
      await del(oldImageUrl);
    }

    // 5. Buat ulang token dengan data baru (tanpa foto profil)
    const newAccessTokenPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profilePictureUrl: undefined,
    };
    const newAccessToken = await new SignJWT(newAccessTokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION!)
        .sign(secret);

    return NextResponse.json({
      success: true,
      message: 'Foto profil berhasil dihapus',
      user: newAccessTokenPayload,
      accessToken: newAccessToken,
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal menghapus foto profil', error: error.message }, { status: 500 });
  }
}