import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import bcryptjs from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  console.log("--- REQUEST REGISTRASI DITERIMA ---");
  await dbConnect();

  try {
    const body = await request.json();
    console.log("--- LANGKAH 1: BODY REQUEST MENTAH ---");
    console.log(body);

    const { name, password, address, dateOfBirth, role } = body;

    console.log("--- LANGKAH 2: NILAI dateOfBirth SETELAH DIAMBIL DARI BODY ---");
    console.log(`Nilai: ${dateOfBirth}, Tipe Data: ${typeof dateOfBirth}`);

    const email = body.email;
    if (!email) {
      return NextResponse.json({ message: 'Email dibutuhkan' }, { status: 400 });
    }
    const lowerCaseEmail = email.toLowerCase();

    if (!name || !password) {
      return NextResponse.json({ message: 'Nama dan password dibutuhkan' }, { status: 400 });
    }

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

    const formattedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    console.log("--- LANGKAH 3: NILAI dateOfBirth SETELAH DIKONVERSI DENGAN new Date() ---");
    console.log(`Nilai: ${formattedDateOfBirth}, Tipe Data: ${typeof formattedDateOfBirth}`);
    if (formattedDateOfBirth) {
        console.log(`Apakah tanggalnya valid?: ${!isNaN(formattedDateOfBirth.getTime())}`);
    }


    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.verifyCode = verifyCode;
      existingUser.verifyCodeExpiry = expiryDate;
      existingUser.name = name;
      existingUser.address = address;
      existingUser.dateOfBirth = formattedDateOfBirth;
      existingUser.role = userRole;
      console.log("--- LANGKAH 4A: MENCOBA UPDATE USER LAMA ---");
      await existingUser.save();
    } else {
      const newUserPayload = {
        name,
        email: lowerCaseEmail,
        password: hashedPassword,
        address,
        dateOfBirth: formattedDateOfBirth,
        role: userRole,
        verifyCode,
        verifyCodeExpiry: expiryDate,
      };
      console.log("--- LANGKAH 4B: MENCOBA MEMBUAT USER BARU ---");
      console.log(newUserPayload);
      await User.create(newUserPayload);
    }
    
    console.log("--- LANGKAH 5: PROSES SIMPAN/UPDATE KE DB BERHASIL ---");
    // ... sisa kode pengiriman email
    return NextResponse.json({ message: 'Pendaftaran berhasil. Cek email Anda untuk kode verifikasi.' }, { status: 201 });

  } catch (error: any) {
    console.error("--- ERROR DI BLOK CATCH UTAMA ---");
    console.error(error); // Ini akan mencetak error Mongoose yang sebenarnya
    return NextResponse.json({ message: 'Gagal mendaftarkan pengguna', error: error.message }, { status: 500 });
  }
}