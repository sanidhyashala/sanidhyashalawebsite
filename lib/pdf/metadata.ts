import fs from "fs";
import pdf from "pdf-parse";

export interface PdfMetadata {
  pages: number;
  size: string;
  updated: string;
}

export async function getPdfMetadata(
  filePath: string
): Promise<PdfMetadata> {
  const buffer = fs.readFileSync(filePath);

  const data = await pdf(buffer);

  const stats = fs.statSync(filePath);

  return {
    pages: data.numpages,

    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,

    updated: stats.mtime.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}