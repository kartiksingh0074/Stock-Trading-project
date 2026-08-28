import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "finnhub.io",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "static2.finnhub.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
