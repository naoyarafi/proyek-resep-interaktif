import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reaction from '@/models/Reaction.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

// Impor model lain agar Mongoose mengenali mereka saat populate
import '@/models/User.model';
import '@/models/Recipe.model';
import Notification from '@/models/Notification.model';
import Recipe from '@/models/Recipe.model';

// ===== FUNGSI GET (Untuk mengambil data reaksi) =====
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
    const reactions = await Reaction.find({ recipe: recipeId });

    const likes = reactions.filter(r => r.type === 'like').length;
    const loves = reactions.filter(r => r.type === 'love').length;

    let userReaction = null;

    const authorizationHeader = request.headers.get('authorization');
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split(' ')[1];
      try {
        const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const reactionFromUser = reactions.find(r => r.user.toString() === userId);
        if (reactionFromUser) {
          userReaction = reactionFromUser.type;
        }
      } catch (e) { /* Abaikan jika token error, user dianggap tidak bereaksi */ }
    }

    return NextResponse.json({
      success: true,
      data: { likes, loves, userReaction },
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mengambil data reaksi', error: error.message }, { status: 500 });
  }
}

// ===== FUNGSI POST (Untuk menambah/mengubah reaksi) =====
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
    const userName = payload.name as string; // Ambil nama dari token

    const body = await request.json();
    const { type } = body;
    if (!['like', 'love'].includes(type)) {
      return NextResponse.json({ message: 'Tipe reaksi tidak valid' }, { status: 400 });
    }

    const updatedReaction = await Reaction.findOneAndUpdate(
      { recipe: recipeId, user: userId },
      { $set: { type: type } },
      { new: true, upsert: true, runValidators: true }
    );

    // --- BAGIAN BARU: MEMBUAT NOTIFIKASI ---
    try {
      // Ambil data resep untuk mendapatkan ID penulisnya
      const recipe = await Recipe.findById(recipeId);
      if (recipe && recipe.author.toString() !== userId) {
        // Hanya buat notifikasi jika user memberi reaksi pada resep orang lain
        const notification = new Notification({
          user: recipe.author, // Penerima notifikasi adalah penulis resep
          sender: userId,
          type: 'reaction',
          message: `${userName} menyukai resep Anda: "${recipe.title}"`,
          link: `/recipes/${recipeId}`,
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error("Gagal membuat notifikasi untuk reaksi:", notificationError);
      // Gagal membuat notifikasi tidak boleh menggagalkan seluruh permintaan
    }

        return NextResponse.json(
            { success: true, message: 'Reaksi berhasil disimpan', data: updatedReaction },
            { status: 200 }
        );
    } catch (error: any) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Gagal memberi reaksi', error: error.message }, { status: 500 });
    }
}

// ===== FUNGSI DELETE (Untuk menghapus reaksi) =====
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... kode DELETE Anda yang sudah ada ...
    await dbConnect();
    const recipeId = params.id;

    try {
        const authorizationHeader = request.headers.get('authorization');
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Token otorisasi tidak ada atau format salah' }, { status: 401 });
        }
        const token = authorizationHeader.split(' ')[1];

        const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const deleteResult = await Reaction.deleteOne({ recipe: recipeId, user: userId });

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json({ success: false, message: 'Reaksi tidak ditemukan untuk dihapus' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Reaksi berhasil dihapus' }, { status: 200 });
    } catch (error: any) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Gagal menghapus reaksi', error: error.message }, { status: 500 });
    }
}