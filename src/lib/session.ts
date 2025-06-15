// src/lib/session.ts
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from './dbConnect';
import User from '@/models/User.model';
import mongoose from 'mongoose';

// Definisikan tipe sederhana untuk membantu TypeScript
type UserWithWishlist = {
  wishlist: mongoose.Types.ObjectId[];
}

export async function getUserWishlist(): Promise<string[]> {
    await dbConnect();
    try {
        const tokenCookie = cookies().get('accessToken');
        const token = tokenCookie?.value;
        if (!token) return [];

        const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        // Gunakan .lean() dan lakukan type assertion
        const user = await User.findById(userId).select('wishlist').lean() as UserWithWishlist | null;

        if (!user || !user.wishlist) {
            return [];
        }

        return user.wishlist.map((id: mongoose.Types.ObjectId) => id.toString());

    } catch (error) {
        // Jika token tidak valid, dll.
        return [];
    }
}