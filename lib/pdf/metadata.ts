import fs from "fs";

export interface PdfMetadata {
  pages: number;
  size: string;
  updated: string;
}

export async function getPdfMetadata(
  filePath: string
): Promise<PdfMetadata> {
  const stats = fs.statSync(filePath);

  return {
    pages: 0, // Temporary (Auto Metadata Engine me replace hoga)
    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
    updated: stats.mtime.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}