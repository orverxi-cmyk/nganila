
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  outputFileTracingExcludes: {
    '*': ['./functions/**/*'],
  },
  
  allowedDevOrigins: [
    '6000-firebase-studio-1779604763538.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev',
    '9000-firebase-studio-1779604763538.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev'
  ],
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 960, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: '*.appspot.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
};

export default nextConfig;
