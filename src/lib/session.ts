// src/lib/session.ts
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from './dbConnect';
import User from '@/models/User.model';
import mongoose from 'mongoose';

type UserWithWishlist = {
  wishlist: mongoose.Types.ObjectId[];
}

export async function getUserWishlist(): Promise<string[]> {
    await dbConnect();
    try {
        // ===== PERBAIKAN: Baca 'refreshToken' dari cookie, BUKAN 'accessToken' =====
        const tokenCookie = cookies().get('refreshToken');
        const token = tokenCookie?.value;

        if (!token) return [];

        // Gunakan REFRESH_SECRET untuk verifikasi
        const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const user = await User.findById(userId).select('wishlist').lean() as UserWithWishlist | null;

        if (!user || !user.wishlist) {
            return [];
        }

        return user.wishlist.map((id: mongoose.Types.ObjectId) => id.toString());

    } catch (error) {
        // Jika token refresh tidak valid, user dianggap tidak login
        console.log("Sesi refresh tidak valid, wishlist tidak diambil.");
        return [];
    }
}