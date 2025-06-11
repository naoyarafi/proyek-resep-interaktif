// src/app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User.model";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password dibutuhkan" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const accessTokenPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const refreshTokenPayload = {
      id: user._id.toString(),
      role: user.role,
    };


    // Menggunakan ANGKA (detik) untuk expiresIn

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: 900 } // 15 menit dalam detik
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: 604800 } // 7 hari dalam detik
    );
    // ===== AKHIR BAGIAN YANG DIPERBAIKI =====

    user.refreshToken = refreshToken;
    await user.save();

    const userProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json(
      {
        message: "Login berhasil!",
        success: true,
        user: userProfile, // <-- KIRIM OBJEK USER
        accessToken,
      },
      { status: 200 }
    );

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800, // maxAge juga dalam detik
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
