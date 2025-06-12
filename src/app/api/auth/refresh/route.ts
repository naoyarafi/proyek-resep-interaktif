import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await dbConnect();

  // 1. Ambil refreshToken dari httpOnly cookie
  const refreshTokenCookie = cookies().get('refreshToken');
  const refreshToken = refreshTokenCookie?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'Refresh token tidak ditemukan' }, { status: 401 });
  }

  try {
    // 2. Verifikasi refreshToken
    const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
    const { payload } = await jwtVerify(refreshToken, secret);

    // 3. Cari user di DB untuk memastikan user masih ada & tidak diblokir
    const user = await User.findById(payload.id);
    if (!user || user.isBlocked) {
      throw new Error('User tidak ditemukan atau diblokir.');
    }

    // 4. Jika semua valid, buat accessToken BARU
    const newAccessTokenPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = await new SignJWT(newAccessTokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRATION!)
        .sign(new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!));

    return NextResponse.json({ success: true, accessToken: newAccessToken });

  } catch (error: any) {
    // Jika refreshToken tidak valid atau kadaluwarsa
    return NextResponse.json({ message: 'Sesi tidak valid, silakan login kembali' }, { status: 401 });
  }
}