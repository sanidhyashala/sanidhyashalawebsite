import fs from "fs/promises";
import { getPDFInfo } from "./engine";

export interface PdfMetadata {
  readonly pages: number;
  readonly size: string;
  readonly updated: string;
}

export async function getPdfMetadata(
  filePath: string
): Promise<PdfMetadata> {
  const stats = await fs.stat(filePath);
  const pdfInfo = await getPDFInfo(filePath);

  return Object.freeze({
    pages: pdfInfo.pages,
    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
    updated: stats.mtime.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  });
}