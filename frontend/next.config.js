/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 14,
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons'],
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // Keep browser API requests on the storefront origin.  The API is deployed
  // separately in production, and mobile Safari/Chrome can reject that
  // deployment's cross-site session cookie.  A rewrite lets the browser store
  // the secure, host-only session cookie as a first-party storefront cookie.
  async rewrites() {
    const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
    const upstream = configuredApiUrl.replace(/\/api$/, '');

    // A relative URL is already same-origin and must not be rewritten back to
    // itself. This also allows deployments that serve the API natively at /api.
    if (!/^https?:\/\//i.test(upstream)) return [];

    return [
      {
        source: '/api/:path*',
        destination: `${upstream}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
