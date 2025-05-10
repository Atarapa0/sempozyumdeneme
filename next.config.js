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
    return config;
  },
};

module.exports = nextConfig; 