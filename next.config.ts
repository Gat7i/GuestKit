import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/lesorangers',
  reactCompiler: true,
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
