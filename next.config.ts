import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.45.27:3000"]
    }
  }
};

// Next.js 15 dev server cross-origin blocking fix
(nextConfig as any).allowedDevOrigins = ["192.168.45.27", "192.168.45.27:3000", "localhost:3000"];

export default nextConfig;
