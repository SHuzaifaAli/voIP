/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/socket.io/:path*',
        destination: 'http://localhost:3001/api/socket.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig;