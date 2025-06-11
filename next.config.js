/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ===== TAMBAHKAN BLOK INI =====
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'asset-2.tstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'asset.kompas.com',
      },
      {
        protocol: 'https',
        hostname: 'd1vbn70lmn1nqe.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'img-global.cpcdn.com',
      },
    ],
  },
  // ===== AKHIR BLOK TAMBAHAN =====
};

module.exports = nextConfig;