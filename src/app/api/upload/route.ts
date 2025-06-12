// src/app/api/upload/route.ts

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'Nama file tidak ditemukan.' }, { status: 400 });
  }

  // Upload file ke Vercel Blob dengan opsi untuk nama unik
  const blob = await put(filename, request.body, {
    access: 'public',
    addRandomSuffix: true, // <-- INI KUNCINYA: Otomatis membuat nama file unik
  });

  return NextResponse.json(blob);
}