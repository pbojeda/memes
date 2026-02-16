import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for monorepo: prevents Turbopack from resolving modules from parent directory
  turbopack: {
    root: __dirname,
  },
  // Allow Cloudinary images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
