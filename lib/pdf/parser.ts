import fs from "fs/promises";
import { PDFAdapter, PDFDocumentType } from "./adapter";

export interface ParsedPDF {
  document: PDFDocumentType;
  bytes: Uint8Array;
}

export async function parsePDF(
  filePath: string
): Promise<ParsedPDF> {
  try {
    const file = await fs.readFile(filePath);

    const bytes = new Uint8Array(file);

    const document =
      await PDFAdapter.PDFDocument.load(bytes);

    return {
      document,
      bytes,
    };
  } catch (error) {
    throw new Error(
      `Unable to parse PDF: ${filePath}\n${error}`
    );
  }
}