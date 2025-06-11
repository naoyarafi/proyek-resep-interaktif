import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Recipe from '@/models/Recipe.model';
import Notification from '@/models/Notification.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
import '@/models/User.model';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const recipeId = params.id;

  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
  }

  try {
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ message: 'Resep tidak ditemukan' }, { status: 404 });
    }

    recipe.isSuspended = !recipe.isSuspended;
    await recipe.save();

    const message = recipe.isSuspended
        ? `Admin menangguhkan resep Anda: "${recipe.title}" karena memerlukan peninjauan.`
        : `Penangguhan pada resep Anda: "${recipe.title}" telah dicabut.`;
    
    const notification = new Notification({
        user: recipe.author,
        type: 'admin_action',
        message: message,
        link: `/recipes/${recipeId}`,
    });
    await notification.save();

    return NextResponse.json({ success: true, message: `Resep berhasil ${recipe.isSuspended ? 'ditangguhkan' : 'diaktifkan'}` });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mengubah status resep', error: error.message }, { status: 500 });
  }
}