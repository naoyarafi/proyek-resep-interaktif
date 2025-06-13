import { z } from "zod";

// Skema untuk form registrasi
export const registerSchema = z
  .object({
    name: z.string().min(3, { message: "Nama minimal harus 3 karakter" }),
    email: z.string().email({ message: "Format email tidak valid" }),
    password: z
      .string()
      .min(8, { message: "Password minimal harus 8 karakter" }),
    confirmPassword: z.string(),
    // Tambahan lain jika ada, misal:
    address: z.string().optional(), // .optional() berarti tidak wajib diisi
    dateOfBirth: z.date().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    // .refine digunakan untuk validasi yang melibatkan lebih dari 1 field
    message: "Password dan Konfirmasi Password tidak cocok",
    path: ["confirmPassword"], // Menampilkan error pada field confirmPassword
  });

// Mengekstrak tipe TypeScript dari skema Zod
export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(1, { message: "Password tidak boleh kosong" }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const recipeSchema = z.object({
  title: z.string().min(3, { message: "Judul minimal 3 karakter" }),
  description: z.string().min(10, { message: "Deskripsi minimal 10 karakter" }),
  imageUrl: z.string().url({ message: "URL gambar tidak valid" }),
  category: z.string().min(1, { message: "Kategori harus dipilih" }), // Kita akan gunakan ID kategori (string)
  mainIngredientUnit: z
    .string()
    .min(1, { message: "Satuan tidak boleh kosong" }),

  mainIngredients: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Nama bahan tidak boleh kosong" }),
        defaultQuantity: z
          .number({ invalid_type_error: "Jumlah harus angka" })
          .min(0.1, { message: "Jumlah tidak boleh nol" }),
      })
    )
    .min(1, { message: "Harus ada minimal 1 bahan utama" }),

  complementaryIngredients: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Nama bahan tidak boleh kosong" }),
        quantityPerUnit: z
          .number({ invalid_type_error: "Jumlah harus angka" })
          .min(0.1, { message: "Jumlah tidak boleh nol" }),
        unit: z.string().min(1, { message: "Satuan tidak boleh kosong" }),
      })
    )
    .optional(),
});

export type RecipeSchema = z.infer<typeof recipeSchema>;

export const verifySchema = z.object({
  code: z.string().length(6, { message: "Kode verifikasi harus 6 digit" }),
});

export type VerifySchema = z.infer<typeof verifySchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password minimal harus 8 karakter" }),
    confirmPassword: z.string(),
    dateOfBirth: z.coerce
      .date({
        errorMap: () => ({ message: "Tanggal lahir harus diisi" }),
      })
      .refine(
        (date) => {
          // Logika untuk menghitung umur
          const today = new Date();
          // Kurangi 13 tahun dari tanggal hari ini
          const thirteenYearsAgo = new Date(
            today.getFullYear() - 13,
            today.getMonth(),
            today.getDate()
          );
          // Validasi berhasil jika tanggal lahir pengguna kurang dari atau sama dengan 13 tahun yang lalu
          return date <= thirteenYearsAgo;
        },
        {
          message: "Anda harus berusia minimal 13 tahun untuk mendaftar",
        }
      )
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan Konfirmasi Password tidak cocok",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
