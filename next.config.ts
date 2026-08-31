import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },

  serverExternalPackages: [
    "@sparticuz/chromium-min",
    "puppeteer-core",
  ],

  allowedDevOrigins: ["192.168.43.25"],
};

export default nextConfig;