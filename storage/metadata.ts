import fs from "fs";
import path from "path";

export interface PDFMetadata {
  title: string;
  slug: string;
  pdf: string;

  pages: number;

  language: string;

  updated: string;

  premium: boolean;

  status: "available" | "coming-soon" | "locked";
}

export function saveMetadata(
  className: string,
  slug: string,
  metadata: PDFMetadata
) {
  const metadataDir = path.join(
    process.cwd(),
    "storage",
    "metadata",
    className
  );

  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  const filePath = path.join(metadataDir, `${slug}.json`);

  fs.writeFileSync(
    filePath,
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  return filePath;
}

export function loadMetadata(
  className: string,
  slug: string
): PDFMetadata | null {
  const filePath = path.join(
    process.cwd(),
    "storage",
    "metadata",
    className,
    `${slug}.json`
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}