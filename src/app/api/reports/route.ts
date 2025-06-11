import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Report from '@/models/Report.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

// Impor model lain agar Mongoose mengenali mereka
import '@/models/User.model';
import '@/models/Recipe.model';

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    // 1. Verifikasi bahwa yang meminta adalah admin
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Ambil semua laporan, urutkan dari yang terbaru
    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: 'recipe',
        select: 'title', // Ambil judul resep
      })
      .populate({
        path: 'reportingUser',
        select: 'name email', // Ambil nama dan email pelapor
      });

    return NextResponse.json({ success: true, data: reports });

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal mengambil laporan', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // 1. Proteksi: Pastikan hanya user yang login yang bisa melapor
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Validasi: Ambil data dari body
    const { recipeId, reason } = await request.json();
    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return NextResponse.json({ message: 'ID Resep tidak valid atau tidak ada' }, { status: 400 });
    }

    // 3. Cek Duplikat: Pastikan user belum pernah melaporkan resep yang sama
    const existingReport = await Report.findOne({
      recipe: recipeId,
      reportingUser: userId,
    });

    if (existingReport) {
      return NextResponse.json({ message: 'Anda sudah pernah melaporkan resep ini' }, { status: 409 }); // 409 Conflict
    }

    // 4. Buat dan simpan laporan baru
    const newReport = new Report({
      recipe: recipeId,
      reportingUser: userId,
      reason: reason || '', // Pastikan reason tidak undefined
    });

    await newReport.save();

    return NextResponse.json(
      { success: true, message: 'Laporan berhasil dikirim. Terima kasih atas masukan Anda.' },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: 'Sesi telah habis, silakan login kembali' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal mengirim laporan', error: error.message }, { status: 500 });
  }
}