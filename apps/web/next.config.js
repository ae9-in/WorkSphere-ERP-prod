/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', 'recharts', 'date-fns']
  },
  async rewrites() {
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Clean trailing slashes or duplicate /api segments
    backendUrl = backendUrl.replace(/\/$/, '');
    if (backendUrl.endsWith('/api')) {
      backendUrl = backendUrl.substring(0, backendUrl.length - 4);
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig

