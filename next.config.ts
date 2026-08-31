import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },

  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],

  outputFileTracingIncludes: {
    "/learning/results/[attemptId]/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },

  allowedDevOrigins: ["192.168.43.25"],
};

export default nextConfig;