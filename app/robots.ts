import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://sanidhyashala.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 👇 Ye naya disallow array add kiya hai bots ko rokne ke liye
      disallow: [
        "/admin/",
        "/api/",
        "/sign-in/",
        "/sign-up/",
        "/reflection/dashboard/",
        "/reflection/edit/",
      ],
    },

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}