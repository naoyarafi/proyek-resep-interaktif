import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Report from '@/models/Report.model';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
import '@/models/User.model';
import '@/models/Recipe.model';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const reportId = params.id;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return NextResponse.json({ message: 'ID laporan tidak valid' }, { status: 400 });
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

    // 2. Cari laporan yang akan di-update
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ message: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    // 3. Ubah status menjadi 'reviewed'
    report.status = 'reviewed';
    await report.save();

    return NextResponse.json({
      success: true,
      message: 'Status laporan berhasil diperbarui',
      data: report,
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal memperbarui status laporan', error: error.message }, { status: 500 });
  }
}