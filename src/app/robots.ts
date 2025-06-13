// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*', // Berlaku untuk semua robot
        allow: '/',      // Izinkan semua halaman
        disallow: '/admin/', // Jangan izinkan robot masuk ke panel admin
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // Beritahu Google di mana peta situs kita
  };
}