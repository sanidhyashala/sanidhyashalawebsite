import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },

  serverExternalPackages: ["@sparticuz/chromium"],
};

export default nextConfig;