import fs from "fs";
import path from "path";

import {
  slugify,
  titleFromSlug,
  getUpdatedDate,
  AutoMetadata,
} from "../storage/auto-metadata";

import { getPDFInfo } from "../lib/pdf/engine";

function ensureDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const NOTES_DIR = path.join(
  process.cwd(),
  "storage",
  "notes"
);

export interface PdfFile {
  className: string;
  filename: string;
  fullPath: string;
}

export function scanAllPDFs(): PdfFile[] {
  const result: PdfFile[] = [];

  if (!fs.existsSync(NOTES_DIR)) {
    console.log("❌ storage/notes folder not found.");
    return result;
  }

  const classes = fs.readdirSync(NOTES_DIR);

  for (const className of classes) {
    const classFolder = path.join(NOTES_DIR, className);

    if (!fs.statSync(classFolder).isDirectory()) continue;

    const files = fs.readdirSync(classFolder);

    for (const file of files) {
      if (!file.toLowerCase().endsWith(".pdf")) continue;

      result.push({
        className,
        filename: file,
        fullPath: path.join(classFolder, file),
      });
    }
  }

  return result;
}

async function buildMetadata(
  pdf: PdfFile
): Promise<AutoMetadata> {
  const info = await getPDFInfo(pdf.fullPath);

  return {
    title: titleFromSlug(slugify(pdf.filename)),
    slug: slugify(pdf.filename),
    pdf: pdf.filename,

    pages: info.pages,

    language: "English",

    updated: getUpdatedDate(pdf.fullPath),

    premium: false,

    status: "available",
  };
}

function saveMetadata(
  className: string,
  metadata: AutoMetadata[]
) {
  const folder = path.join(
    process.cwd(),
    "storage",
    "metadata",
    className
  );

  ensureDirectory(folder);

  fs.writeFileSync(
    path.join(folder, "notes.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  console.log(`💾 Saved ${className}/notes.json`);
}

async function main() {
  console.log("\n📚 Scanning PDFs...\n");

  const pdfs = scanAllPDFs();

  console.log(`Found ${pdfs.length} PDF(s).\n`);

  const grouped: Record<string, AutoMetadata[]> = {};

  for (const pdf of pdfs) {
    const metadata = await buildMetadata(pdf);

    if (!grouped[pdf.className]) {
      grouped[pdf.className] = [];
    }

    grouped[pdf.className].push(metadata);
  }

  for (const className of Object.keys(grouped)) {
    saveMetadata(className, grouped[className]);
  }

  console.log("\n🎉 Metadata generation completed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});