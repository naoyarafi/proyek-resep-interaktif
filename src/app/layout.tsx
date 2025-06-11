// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Resep Interaktif",
  description: "Dibuat dengan Next.js Oleh Naoya Rafi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar /> {/* <-- 2. Letakkan Navbar di sini */}
        <main>{children}</main> {/* Membungkus children dengan <main> adalah praktik yang baik */}
      </body>
    </html>
  );
}