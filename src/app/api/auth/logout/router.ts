// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Cara "menghapus" cookie adalah dengan mengaturnya kembali
    // dengan nilai kosong dan tanggal kedaluwarsa di masa lalu.
    cookies().set('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0), // Set tanggal kedaluwarsa ke masa lalu
    });

    return NextResponse.json(
      {
        message: 'Logout berhasil',
        success: true,
      },
      { status: 200 }
    );

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}