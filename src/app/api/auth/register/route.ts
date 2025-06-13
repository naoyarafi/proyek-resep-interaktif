import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import bcryptjs from 'bcryptjs';
import { Resend } from 'resend';
export const dynamic = 'force-dynamic';
// Pindahkan inisialisasi Resend ke luar fungsi agar tidak dibuat ulang setiap request
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { name, password, address, dateOfBirth, role } = body;
    
    // --- PERBAIKAN UTAMA: Tangani Email Case-Insensitive ---
    // 1. Ambil email dari body dan pastikan tidak kosong
    const email = body.email;
    if (!email) {
        return NextResponse.json({ message: 'Email dibutuhkan' }, { status: 400 });
    }
    // 2. Ubah email menjadi huruf kecil untuk konsistensi
    const lowerCaseEmail = email.toLowerCase();
    // ----------------------------------------------------

    // Validasi input dasar lainnya
    if (!name || !password) {
      return NextResponse.json(
        { message: 'Nama dan password dibutuhkan' },
        { status: 400 }
      );
    }
    
    // Gunakan email huruf kecil untuk semua query database
    const existingVerifiedUser = await User.findOne({ email: lowerCaseEmail, isVerified: true });
    if (existingVerifiedUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar dan terverifikasi' }, { status: 409 });
    }
    
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    const hashedPassword = await bcryptjs.hash(password, 10);
    const existingUser = await User.findOne({ email: lowerCaseEmail });

    const userRole = role === 'admin' ? 'admin' : 'user';

    if (existingUser) {
      // Jika user ada tapi belum verifikasi, update datanya
      existingUser.password = hashedPassword;
      existingUser.verifyCode = verifyCode;
      existingUser.verifyCodeExpiry = expiryDate;
      existingUser.name = name;
      existingUser.address = address;
      existingUser.dateOfBirth = dateOfBirth;
      existingUser.role = userRole;
      await existingUser.save();
    } else {
      // Jika user benar-benar baru, buat dokumen baru dengan email huruf kecil
      await User.create({
        name,
        email: lowerCaseEmail, // Simpan email dalam format huruf kecil
        password: hashedPassword,
        address,
        dateOfBirth,
        role: userRole,
        verifyCode,
        verifyCodeExpiry: expiryDate,
      });
    }
    
    // Kirim email verifikasi
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // GANTI INI dengan domain terverifikasi Anda
        to: lowerCaseEmail, // Kirim ke email yang sudah di-lowercase
        subject: 'Kode Verifikasi untuk Akun Resep Anda',
        html: `<p>Gunakan kode OTP berikut untuk menyelesaikan pendaftaran: <strong>${verifyCode}</strong></p><p>Kode ini hanya berlaku selama 1 jam.</p>`
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