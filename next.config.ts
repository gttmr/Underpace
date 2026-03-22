import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "192.168.45.27:3000",
        "pink-walrus-25.loca.lt",
      ]
    }
  },
  // Next.js 15 dev server cross-origin blocking fix
  allowedDevOrigins: [
    "localhost:3000",
    "192.168.45.27",
    "192.168.45.27:3000",
    "pink-walrus-25.loca.lt",
    "*.loca.lt",
  ],
};

export default nextConfig;
