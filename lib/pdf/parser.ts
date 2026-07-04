import fs from "fs/promises";
import { PDFAdapter, PDFDocumentType } from "./adapter";

export interface ParsedPDF {
  readonly document: PDFDocumentType;
  readonly bytes: Uint8Array;
}

export async function parsePDF(
  filePath: string
): Promise<ParsedPDF> {
  try {
    const file = await fs.readFile(filePath);

    const bytes = new Uint8Array(file);

    if (bytes.length === 0) {
      throw new Error("Cannot parse PDF: file is empty.");
    }

    const document =
      await PDFAdapter.PDFDocument.load(bytes);

    return Object.freeze({
      document,
      bytes,
    });
  } catch (error) {
    throw new Error("Failed to parse PDF document.", { cause: error });
  }
}