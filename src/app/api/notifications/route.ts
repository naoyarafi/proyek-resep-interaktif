import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification.model';
import { jwtVerify } from 'jose';

// Impor model lain agar Mongoose mengenali mereka
import '@/models/User.model';

// FUNGSI GET: Mengambil notifikasi untuk user yang sedang login
export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    // Proteksi: Pastikan hanya user yang login yang bisa mengambil notifikasinya
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) // Tampilkan yang terbaru di atas
      .limit(20) // Batasi 20 notifikasi terakhir
      .populate('sender', 'name profilePictureUrl'); // Ambil info pengirim

    // Hitung notifikasi yang belum dibaca
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal mengambil notifikasi', error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  await dbConnect();

  try {
    // Proteksi route
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Update semua notifikasi yang belum dibaca milik user ini menjadi sudah dibaca
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ success: true, message: 'Notifikasi ditandai telah dibaca' });

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: 'Sesi telah habis' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Gagal memperbarui notifikasi', error: error.message }, { status: 500 });
  }
}