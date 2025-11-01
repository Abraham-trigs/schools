import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Output directory for build (optional, if you deploy to Docker or Vercel)
  distDir: 'build',

  // Image handling
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'School Management System',
  },
};

export default nextConfig;
