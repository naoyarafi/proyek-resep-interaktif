// src/lib/dbConnect.ts
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    'Tolong definisikan variabel lingkungan MONGO_URI di dalam .env.local'
  );
}

/**
 * Cache koneksi global. Ini memungkinkan koneksi untuk digunakan kembali
 * di seluruh pemanggilan fungsi serverless, mengurangi jumlah koneksi
 * baru ke MongoDB.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Jika koneksi sudah di-cache, gunakan itu
  if (cached.conn) {
    return cached.conn;
  }

  // Jika tidak ada promise koneksi, buat yang baru
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  // Tunggu promise koneksi selesai dan simpan koneksinya
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;