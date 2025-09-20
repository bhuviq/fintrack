
import type {NextConfig} from 'next';

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is required to allow the Next.js dev server to accept requests from the
  // Firebase Studio preview URL.
  allowedDevOrigins: ['*.cloudworkstations.dev'],
};

// Apply PWA wrapper only when not using Turbopack (i.e., for production builds)
// The "next dev --turbopack" command sets process.env.TURBOPACK to "1"
const finalConfig = process.env.TURBOPACK ? nextConfig : withPWA(nextConfig);

export default finalConfig;
