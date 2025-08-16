/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/logline/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'frontend/out',
}

export default nextConfig
