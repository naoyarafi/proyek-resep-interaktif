import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Suspense } from "react"; // <-- 1. Impor Suspense
import { Box, CircularProgress } from "@mui/material"; // Impor komponen untuk UI loading
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Website Resep Interaktif",
  description: "Dibuat dengan Next.js dan Gemini",
};

// Komponen untuk fallback UI saat Suspense menunggu
function LoadingFallback() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Box>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar tetap di luar Suspense agar selalu tampil */}
        <Navbar />
        <main>
          {/* ===== BUNGKUS {children} DENGAN SUSPENSE ===== */}
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
        </main>
        <Footer />
      </body>
    </html>
  );
}