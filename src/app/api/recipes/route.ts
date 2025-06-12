// src/app/api/recipes/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Recipe from "@/models/Recipe.model";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import "@/models/User.model";
import "@/models/Category.model";
import Category from "@/models/Category.model";
import Reaction from '@/models/Reaction.model';
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // 1. Dapatkan token dari header Authorization
    const authorizationHeader = request.headers.get("authorization");
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Token otorisasi tidak ditemukan atau format salah" },
        { status: 401 }
      );
    }
    const token = authorizationHeader.split(" ")[1];

    // 2. Verifikasi token menggunakan 'jose'
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // 3. Ambil ID pengguna dari payload token
    const userId = payload.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Token tidak valid" },
        { status: 401 }
      );
    }

    // 4. Ambil data resep dari body request
    const body = await request.json();

    // 5. Buat resep baru dengan menyertakan 'author' dari ID pengguna
    const newRecipe = new Recipe({
      ...body,
      author: userId, // Set author dengan ID dari pengguna yang sudah login
    });

    await newRecipe.save();

    return NextResponse.json(
      { message: "Resep berhasil dibuat!", success: true, data: newRecipe },
      { status: 201 }
    );
  } catch (error: any) {
    // Tangani error jika token tidak valid (kadaluwarsa, dll)
    if (error.code === "ERR_JWT_EXPIRED") {
      return NextResponse.json(
        { message: "Sesi telah habis, silakan login kembali" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Gagal membuat resep", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search') || '';
    const categoryQuery = url.searchParams.get('category');
    const sortByQuery = url.searchParams.get('sortBy');

    let filter: any = {
      isSuspended: { $ne: true },
    };
    if (searchQuery) {
      filter.title = { $regex: searchQuery, $options: 'i' };
    }
    if (categoryQuery) {
      filter.category = categoryQuery;
    }

    let recipes;

    if (sortByQuery === 'populer') {
      // --- JIKA SORT BY 'POPULER', GUNAKAN AGGREGATION PIPELINE ---
      recipes = await Recipe.aggregate([
        // Tahap 1: Filter resep yang relevan (tidak ditangguhkan, sesuai kategori/pencarian)
        { $match: filter },

        // Tahap 2: "Join" dengan koleksi 'reactions'
        {
          $lookup: {
            from: 'reactions',      // Koleksi yang akan di-join
            localField: '_id',      // Field dari koleksi 'recipes'
            foreignField: 'recipe', // Field dari koleksi 'reactions'
            as: 'reactionData',     // Nama field baru untuk menyimpan hasil join
          },
        },

        // Tahap 3: Buat field baru 'reactionCount' berisi jumlah reaksi
        {
          $addFields: {
            reactionCount: { $size: '$reactionData' },
          },
        },

        // Tahap 4: Urutkan berdasarkan jumlah reaksi (terbanyak ke terkecil)
        { $sort: { reactionCount: -1, createdAt: -1 } },

        // Tahap 5 & 6: Lakukan populate manual untuk author dan category
        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },

        // Tahap 7: Rapikan hasil 'populate'
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      ]);

    } else {
      // --- JIKA SORT BY BIASA, GUNAKAN CARA LAMA ---
      let sortOptions: any = { createdAt: -1 }; // Default: terbaru
      if (sortByQuery === 'terlama') {
        sortOptions = { createdAt: 1 };
      }
      recipes = await Recipe.find(filter)
        .sort(sortOptions)
        .populate('author', 'name')
        .populate('category', 'name');
    }

    return NextResponse.json({ success: true, data: recipes });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mengambil resep', error: error.message }, { status: 500 });
  }
}