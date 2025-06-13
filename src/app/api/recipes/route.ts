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

    // ===== BAGIAN BARU: Ambil Parameter Paginasi =====
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '6', 10); // Default 6 resep per halaman
    const skip = (page - 1) * limit;

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
    // ===== BAGIAN BARU: Hitung total resep sebelum query utama =====
    const totalRecipes = await Recipe.countDocuments(filter);
    const totalPages = Math.ceil(totalRecipes / limit);


    if (sortByQuery === 'populer') {
      recipes = await Recipe.aggregate([
        { $match: filter },
        { $lookup: { from: 'reactions', localField: '_id', foreignField: 'recipe', as: 'reactionData' }},
        { $addFields: { reactionCount: { $size: '$reactionData' } }},
        { $sort: { reactionCount: -1, createdAt: -1 } },
        // ===== BAGIAN BARU: Tambahkan Paginasi ke Agregasi =====
        { $skip: skip },
        { $limit: limit },
        // ===================================================
        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      ]);
    } else {
      let sortOptions: any = { createdAt: -1 };
      if (sortByQuery === 'terlama') {
        sortOptions = { createdAt: 1 };
      }
      recipes = await Recipe.find(filter)
        .sort(sortOptions)
        // ===== BAGIAN BARU: Tambahkan Paginasi ke Query find() =====
        .skip(skip)
        .limit(limit)
        // ========================================================
        .populate('author', 'name')
        .populate('category', 'name');
    }

    // ===== BAGIAN BARU: Sertakan Info Paginasi dalam Respons =====
    return NextResponse.json({ 
      success: true, 
      data: recipes,
      pagination: {
        totalRecipes,
        totalPages,
        currentPage: page,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mengambil resep', error: error.message }, { status: 500 });
  }
}