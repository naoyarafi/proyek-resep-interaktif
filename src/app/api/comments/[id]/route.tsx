import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const commentId = params.id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return NextResponse.json({ message: 'ID komentar tidak valid' }, { status: 400 });
  }

  try {
    // 1. Verifikasi token pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Cari komentar di database
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Komentar tidak ditemukan' }, { status: 404 });
    }

    // 3. Lakukan Pengecekan Kepemilikan!
    if (comment.user.toString() !== userId) {
      // Jika ID user di token tidak sama dengan ID user pembuat komentar
      return NextResponse.json({ message: 'Anda tidak diizinkan menghapus komentar ini' }, { status: 403 }); // 403 Forbidden
    }

    // 4. Jika semua pemeriksaan lolos, hapus komentar
    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ success: true, message: 'Komentar berhasil dihapus' }, { status: 200 });

  } catch (error: any) {
    // ... (error handling lainnya)
    return NextResponse.json({ message: 'Gagal menghapus komentar', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const commentId = params.id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return NextResponse.json({ message: 'ID komentar tidak valid' }, { status: 400 });
  }

  try {
    // 1. Verifikasi token pengguna
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Ambil teks baru dari body
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ message: 'Teks komentar tidak boleh kosong' }, { status: 400 });
    }

    // 3. Cari komentar di database
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Komentar tidak ditemukan' }, { status: 404 });
    }

    // 4. Lakukan Pengecekan Kepemilikan!
    if (comment.user.toString() !== userId) {
      return NextResponse.json({ message: 'Anda tidak diizinkan mengedit komentar ini' }, { status: 403 });
    }

    // 5. Jika lolos, update teks dan simpan
    comment.text = text;
    await comment.save();

    return NextResponse.json({ success: true, message: 'Komentar berhasil diperbarui', data: comment });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui komentar', error: error.message }, { status: 500 });
  }
}