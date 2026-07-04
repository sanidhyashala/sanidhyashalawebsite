import path from "path";
import { getPdfMetadata } from "./metadata";
import { ResourceItem } from "@/app/components/resources/resourceTypes";

interface BuildResourceOptions {
  readonly title: string;
  readonly slug: string;
  readonly pdf: string;
  readonly className: string;
  readonly category: string;
  readonly status?: "available" | "coming-soon" | "locked";
  readonly language?: string;
  readonly premium?: boolean;
}

export async function buildResource(
  options: BuildResourceOptions
): Promise<ResourceItem> {
  const pdfPath = path.join(
    process.cwd(),
    "public",
    "resources",
    options.category,
    options.className,
    options.pdf
  );

  const metadata = await getPdfMetadata(pdfPath);

  if (!(metadata.pages > 0)) {
    throw new Error(
      `Invalid metadata for resource "${options.slug}": pages must be greater than 0.`
    );
  }

  return Object.freeze({
    title: options.title,
    slug: options.slug,
    pdf: options.pdf,

    status: options.status ?? "available",

    pages: metadata.pages,

    updated: metadata.updated,

    language: options.language ?? "English",

    premium: options.premium ?? false,
  });
}