import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for monorepo: prevents Turbopack from resolving modules from parent directory
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
