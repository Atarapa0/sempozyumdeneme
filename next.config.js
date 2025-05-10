/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Projenin src klasöründen başlaması için gerekli ayarlar
  distDir: '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Dinamik sayfalar için statik oluşturmayı devre dışı bırak
  output: 'standalone',
  webpack: (config) => {
    config.module.rules.push({
      test: /react-icons/,
      loader: 'ignore-loader',
    });
    
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    return config;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // API zaman aşımı sorunlarını önlemek için
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    externalDir: true,
  },
};

module.exports = nextConfig; 