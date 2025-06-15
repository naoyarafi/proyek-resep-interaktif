// src/app/api/users/me/wishlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { jwtVerify, SignJWT } from 'jose';
import mongoose from 'mongoose';
import '@/models/Recipe.model';

export async function PATCH(request: NextRequest) {
  await dbConnect();
  try {
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error("Token tidak ada");
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const { recipeId } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    const index = user.wishlist.findIndex((id: mongoose.Types.ObjectId) => id.toString() === recipeId);
    let message = '';
    if (index > -1) {
      user.wishlist.splice(index, 1);
      message = 'Resep dihapus dari wishlist';
    } else {
      user.wishlist.push(new mongoose.Types.ObjectId(recipeId));
      message = 'Resep ditambahkan ke wishlist';
    }
    await user.save();

    // ===== BAGIAN BARU: KIRIM KEMBALI DATA USER LENGKAP & TOKEN BARU =====
    const updatedUserProfile = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        wishlist: user.wishlist.map((id: mongoose.Types.ObjectId) => id.toString()),
    };
    const newAccessToken = await new SignJWT(updatedUserProfile)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION!)
        .sign(secret);

    return NextResponse.json({ 
        success: true, 
        message, 
        user: updatedUserProfile,
        accessToken: newAccessToken
    });
    // =================================================================

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui wishlist', error: error.message }, { status: 500 });
  }
}

// Handler untuk mengambil semua resep di wishlist
export async function GET(request: NextRequest) {
    await dbConnect();
    try {
        // ===== PERBAIKAN: Baca token dari Header, bukan Cookie =====
        const authorizationHeader = request.headers.get('authorization');
        if (!authorizationHeader) throw new Error("Token otorisasi tidak ada");
        const token = authorizationHeader.split(' ')[1];
        // ========================================================

        const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const user = await User.findById(userId).populate({
            path: 'wishlist',
            populate: {
                path: 'author category',
                select: 'name profilePictureUrl'
            }
        });

        if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

        return NextResponse.json({ success: true, data: user.wishlist });

    } catch (error: any) {
        // Jika token tidak valid, kembalikan data kosong agar tidak error di frontend
        if (error.code === 'ERR_JWT_EXPIRED' || error.message.includes('Token')) {
            return NextResponse.json({ success: false, data: [] });
        }
        return NextResponse.json({ message: 'Gagal mengambil wishlist', error: error.message }, { status: 500 });
    }
}