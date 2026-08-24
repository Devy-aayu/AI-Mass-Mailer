import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    // Production on Vercel: /api/* is handled directly by api/index.py.
    // Local `npm run dev`: set BACKEND_URL=http://localhost:8001 if you want
    // the normal Next.js dev server to proxy API requests to FastAPI.
    if (!backendUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
