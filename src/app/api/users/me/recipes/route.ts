import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Recipe from '@/models/Recipe.model';
import { jwtVerify } from 'jose';
import '@/models/Category.model';

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    // 1. Verifikasi token untuk mendapatkan ID pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Cari semua resep dengan author yang cocok dengan ID pengguna
    const myRecipes = await Recipe.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('category', 'name');

    return NextResponse.json({ success: true, data: myRecipes });

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal mengambil resep Anda', error: error.message }, { status: 500 });
  }
}