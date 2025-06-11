import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import bcryptjs from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  await dbConnect();

  try {
    // Ambil semua data dari body, termasuk 'role' yang mungkin ada
    const { name, email, password, address, dateOfBirth, role } = await request.json();

    const existingVerifiedUser = await User.findOne({ email, isVerified: true });
    if (existingVerifiedUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar dan terverifikasi' }, { status: 409 });
    }
    
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    const hashedPassword = await bcryptjs.hash(password, 10);
    const existingUser = await User.findOne({ email });

    // Tentukan role, default ke 'user' jika tidak ada atau tidak valid
    const userRole = role === 'admin' ? 'admin' : 'user';

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.verifyCode = verifyCode;
      existingUser.verifyCodeExpiry = expiryDate;
      existingUser.name = name;
      existingUser.address = address;
      existingUser.dateOfBirth = dateOfBirth;
      existingUser.role = userRole; // <-- DITAMBAHKAN KEMBALI
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        address,
        dateOfBirth,
        role: userRole, // <-- DITAMBAHKAN KEMBALI
        verifyCode,
        verifyCodeExpiry: expiryDate,
      });
    }
    
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', 
        to: email,
        subject: 'Kode Verifikasi untuk Akun Resep Interaktif Anda',
        html: `<p>Gunakan kode OTP berikut untuk menyelesaikan pendaftaran: <strong>${verifyCode}</strong></p><p>Kode ini berlaku selama 1 jam.</p>`
      });
      return NextResponse.json({ message: 'Pendaftaran berhasil. Cek email Anda untuk kode verifikasi.' }, { status: 201 });
    } catch (emailError) {
      console.error("Gagal mengirim email verifikasi:", emailError);
      return NextResponse.json({ message: 'Gagal mengirim email verifikasi, coba lagi nanti.' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ message: 'Gagal mendaftarkan pengguna', error: error.message }, { status: 500 });
  }
}