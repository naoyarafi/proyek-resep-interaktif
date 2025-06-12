// src/app/api/recipes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Recipe from '@/models/Recipe.model';
import User from '@/models/User.model';
import Category from '@/models/Category.model';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

// Fungsi untuk menangani request GET ke /api/recipes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  // Validasi apakah ID yang diberikan adalah ObjectId yang valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
  }

  try {
    const recipe = await Recipe.findById(id)
      .populate('author', 'name')
      .populate('category', 'name');

    // Jika resep tidak ditemukan
    if (!recipe || recipe.isSuspended) {
      return NextResponse.json({ message: 'Resep tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: recipe });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mengambil resep', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const recipeId = params.id;

  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
  }

  try {
    // 1. Verifikasi token pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Cari resep di database
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ message: 'Resep tidak ditemukan' }, { status: 404 });
    }

    // 3. PENTING: Lakukan Pengecekan Kepemilikan!
    if (recipe.author.toString() !== userId) {
      return NextResponse.json({ message: 'Anda tidak diizinkan menghapus resep ini' }, { status: 403 });
    }

    // 4. Jika semua pemeriksaan lolos, hapus resep
    await Recipe.findByIdAndDelete(recipeId);

    // Catatan: Di aplikasi nyata, kita juga akan menghapus semua
    // reaksi dan komentar yang terkait dengan resep ini.
    // Untuk sekarang, ini sudah cukup.

    return NextResponse.json({ success: true, message: 'Resep berhasil dihapus' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal menghapus resep', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const recipeId = params.id;

  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
  }

  try {
    // 1. Verifikasi token pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Cari resep di database
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ message: 'Resep tidak ditemukan' }, { status: 404 });
    }

    // 3. Lakukan Pengecekan Kepemilikan! (Sama seperti DELETE)
    if (recipe.author.toString() !== userId) {
      return NextResponse.json({ message: 'Anda tidak diizinkan mengedit resep ini' }, { status: 403 });
    }

    // 4. Ambil data baru dan perbarui dokumen
    const body = await request.json();
    const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, body, {
        new: true, // Kembalikan dokumen yang sudah terupdate
        runValidators: true, // Jalankan validator schema saat update
    });

    return NextResponse.json({ success: true, message: 'Resep berhasil diperbarui', data: updatedRecipe });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui resep', error: error.message }, { status: 500 });
  }
}

