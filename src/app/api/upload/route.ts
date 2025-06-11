import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// Membuat fungsi untuk generate ID unik
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
);

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json(
      { message: 'Nama file tidak ditemukan.' },
      { status: 400 }
    );
  }

  // Buat nama file baru yang unik untuk menghindari konflik
  const newFilename = `<span class="math-inline">\{nanoid\(\)\}\-</span>{filename}`;

  // Upload file ke Vercel Blob
  const blob = await put(newFilename, request.body, {
    access: 'public', // Membuat file bisa diakses publik
  });

  // Kembalikan data blob (termasuk URL publiknya) ke frontend
  return NextResponse.json(blob);
}