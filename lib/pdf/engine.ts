import { parsePDF } from "./parser";

export interface PDFInfo {
  readonly pages: number;
}

export async function getPDFInfo(
  filePath: string
): Promise<PDFInfo> {
  let pages: number;
  try {
    const pdf = await parsePDF(filePath);
    pages = pdf.document.getPageCount();
  } catch (error) {
    throw new Error("Failed to read PDF metadata.", { cause: error });
  }

  if (pages <= 0) {
    throw new Error("Invalid PDF: page count must be greater than zero.");
  }

  return Object.freeze({
    pages,
  });
}