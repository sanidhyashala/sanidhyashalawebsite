import { parsePDF } from "./parser";

export interface PDFInfo {
  pages: number;
}

export async function getPDFInfo(
  filePath: string
): Promise<PDFInfo> {
  const pdf = await parsePDF(filePath);

  return {
    pages: pdf.document.getPageCount(),
  };
}