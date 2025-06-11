// src/app/admin/layout.tsx

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import Link from "next/link";

// Fungsi helper untuk mendapatkan sesi dari cookie di server
async function getSession() {
  const refreshToken = cookies().get("refreshToken")?.value;
  if (!refreshToken) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
    const { payload } = await jwtVerify(refreshToken, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  // Jika tidak ada sesi atau role BUKAN admin, tendang ke halaman utama
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Jika lolos, tampilkan layout admin dengan konten halamannya ({children})
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Panel Admin
        </Typography>

        {/* ===== BAGIAN NAVIGASI ADMIN ===== */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 4,
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Button component={Link} href="/admin/users">
            Kelola Pengguna
          </Button>
          <Button component={Link} href="/admin/recipes">
            Kelola Resep
          </Button>
          <Button component={Link} href="/admin/reports">
            Kelola Laporan
          </Button>
        </Box>

        <main>{children}</main>
      </Box>
    </Container>
  );
}
