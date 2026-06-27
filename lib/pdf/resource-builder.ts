import path from "path";
import { getPdfMetadata } from "./metadata";
import { ResourceItem } from "@/app/components/resources/resourceTypes";

interface BuildResourceOptions {
  title: string;
  slug: string;
  pdf: string;
  status?: "available" | "coming-soon" | "locked";
  language?: string;
  premium?: boolean;
}

export async function buildResource(
  options: BuildResourceOptions
): Promise<ResourceItem> {
  const pdfPath = path.join(
    process.cwd(),
    "public",
    "resources",
    "notes",
    "class-12",
    options.pdf
  );

  const metadata = await getPdfMetadata(pdfPath);

  return {
    title: options.title,
    slug: options.slug,
    pdf: options.pdf,

    status: options.status ?? "available",

    pages: metadata.pages,

    updated: metadata.updated,

    language: options.language ?? "English",

    premium: options.premium ?? false,
  };
}