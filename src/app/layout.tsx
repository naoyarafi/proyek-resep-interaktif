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
  title: "Resep Interaktif - Temukan & Kreasikan Resep Favoritmu",
  description: "Platform untuk mencari, menyimpan, dan berinteraksi dengan ribuan resep masakan. Ubah porsi bahan secara dinamis dan bagikan kreasimu.",
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
      <body 
        className={inter.className} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh' 
        }}
      >
        <Navbar />
        <main style={{ flexGrow: 1 }}> {/* flexGrow: 1 akan mendorong footer ke bawah */}
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
        </main>
        <Footer />
      </body>
    </html>
  );
}