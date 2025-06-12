import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const userIdToUpdate = params.id;

  if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
    return NextResponse.json({ message: 'ID User tidak valid' }, { status: 400 });
  }

  try {
    // 1. Verifikasi bahwa yang membuat permintaan adalah admin
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak: Hanya admin yang bisa melakukan aksi ini' }, { status: 403 });
    }

    // 2. Cari user yang akan di-update
    const userToUpdate = await User.findById(userIdToUpdate);
    if (!userToUpdate) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // 3. Pencegahan: Admin tidak bisa memblokir diri sendiri
    if(payload.id === userToUpdate._id.toString()){
        return NextResponse.json({ message: 'Admin tidak dapat memblokir diri sendiri' }, { status: 400 });
    }

    // 4. Balikkan status isBlocked
    userToUpdate.isBlocked = !userToUpdate.isBlocked;
    await userToUpdate.save();

    return NextResponse.json({
      success: true,
      message: `User berhasil ${userToUpdate.isBlocked ? 'diblokir' : 'diaktifkan'}`,
      data: userToUpdate,
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui status user', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const userIdToDelete = params.id;

  if (!mongoose.Types.ObjectId.isValid(userIdToDelete)) {
    return NextResponse.json({ message: 'ID User tidak valid' }, { status: 400 });
  }

  try {
    // 1. Verifikasi bahwa yang membuat permintaan adalah admin
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) throw new Error('Token otorisasi tidak ada');
    const token = authorizationHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Pencegahan: Admin tidak bisa menghapus diri sendiri
    if(payload.id === userIdToDelete){
        return NextResponse.json({ message: 'Admin tidak dapat menghapus akunnya sendiri' }, { status: 400 });
    }

    // 3. Hapus pengguna dari database
    const deletedUser = await User.findByIdAndDelete(userIdToDelete);

    if (!deletedUser) {
        return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Catatan: Di aplikasi nyata, kita juga akan menghapus semua
    // resep, komentar, dan reaksi yang dibuat oleh user ini.

    return NextResponse.json({ success: true, message: 'User berhasil dihapus secara permanen' });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal menghapus user', error: error.message }, { status: 500 });
  }
}