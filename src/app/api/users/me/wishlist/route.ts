import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

// Handler untuk menambah/menghapus resep dari wishlist
export async function PATCH(request: NextRequest) {
  await dbConnect();
  try {
    const userId = (await jwtVerify(request.cookies.get('accessToken')?.value!, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!))).payload.id as string;

    const { recipeId } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    // Cek apakah resep sudah ada di wishlist
    const index = user.wishlist.findIndex((id: mongoose.Types.ObjectId) => id.toString() === recipeId);

    let message = '';
    if (index > -1) {
      // Jika sudah ada, hapus dari wishlist
      user.wishlist.splice(index, 1);
      message = 'Resep dihapus dari wishlist';
    } else {
      // Jika belum ada, tambahkan ke wishlist
      user.wishlist.push(new mongoose.Types.ObjectId(recipeId));
      message = 'Resep ditambahkan ke wishlist';
    }

    await user.save();
    return NextResponse.json({ success: true, message, wishlist: user.wishlist });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui wishlist', error: error.message }, { status: 500 });
  }
}

// Handler untuk mengambil semua resep di wishlist
export async function GET(request: NextRequest) {
    await dbConnect();
    try {
        const userId = (await jwtVerify(request.cookies.get('accessToken')?.value!, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!))).payload.id as string;

        const user = await User.findById(userId).populate({
            path: 'wishlist',
            populate: {
                path: 'author category',
                select: 'name'
            }
        });

        if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

        return NextResponse.json({ success: true, data: user.wishlist });

    } catch (error: any) {
        return NextResponse.json({ message: 'Gagal mengambil wishlist', error: error.message }, { status: 500 });
    }
}