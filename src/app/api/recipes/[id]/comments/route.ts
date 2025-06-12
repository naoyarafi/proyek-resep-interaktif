import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

// Impor model lain untuk Mongoose
import '@/models/User.model';
import '@/models/Recipe.model';
import Notification from '@/models/Notification.model';
import Recipe from '@/models/Recipe.model';

export const dynamic = 'force-dynamic';

// FUNGSI GET: Mengambil semua komentar untuk sebuah resep
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const recipeId = params.id;

  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return NextResponse.json({ message: 'ID resep tidak valid' }, { status: 400 });
  }

  try {
    const comments = await Comment.find({ recipe: recipeId })
      .populate('user', 'name profilePictureUrl') // Ambil nama dan foto profil user
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mengambil komentar', error: error.message }, { status: 500 });
  }
}

// FUNGSI POST: Menambah komentar baru (terlindungi)
export async function POST(
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
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    const userName = payload.name as string;

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ message: 'Teks komentar tidak boleh kosong' }, { status: 400 });
    }

    const newComment = new Comment({
      recipe: recipeId,
      user: userId,
      text,
    });
    await newComment.save();
    await newComment.populate('user', 'name profilePictureUrl');

    try {
      const recipe = await Recipe.findById(recipeId);
      if (recipe && recipe.author.toString() !== userId) {
        const notification = new Notification({
          user: recipe.author,
          sender: userId,
          type: 'comment',
          message: `${userName} mengomentari resep Anda: "${recipe.title}"`,
          link: `/recipes/${recipeId}`,
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error("Gagal membuat notifikasi untuk komentar:", notificationError);
    }

    return NextResponse.json(
      { success: true, message: 'Komentar berhasil ditambahkan', data: newComment },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal menambah komentar', error: error.message }, { status: 500 });
  }
}