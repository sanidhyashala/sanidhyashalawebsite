import fs from "fs";
import path from "path";

const STORAGE = path.join(process.cwd(), "storage");
const METADATA_ROOT = path.join(STORAGE, "metadata");
const NOTES_ROOT = path.join(STORAGE, "notes");

let totalClasses = 0;
let totalResources = 0;
let totalErrors = 0;

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
  totalErrors++;
}

if (!fs.existsSync(METADATA_ROOT)) {
  throw new Error("storage/metadata folder not found.");
}

const classes = fs
  .readdirSync(METADATA_ROOT)
  .filter((dir) =>
    fs.statSync(path.join(METADATA_ROOT, dir)).isDirectory()
  );

console.log("\n🔍 SanidhyaShala Metadata Scanner\n");

for (const className of classes) {
  totalClasses++;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📚 ${className}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const metadataFile = path.join(
    METADATA_ROOT,
    className,
    "notes.json"
  );

  if (!fs.existsSync(metadataFile)) {
    logError("notes.json missing");
    continue;
  }

  logSuccess("notes.json found");

  const pdfFolder = path.join(NOTES_ROOT, className);

  if (!fs.existsSync(pdfFolder)) {
    logError("PDF folder missing");
    continue;
  }

  logSuccess("PDF folder found");

  const notes = JSON.parse(
    fs.readFileSync(metadataFile, "utf8")
  );

  if (!Array.isArray(notes)) {
    logError("notes.json is not an array");
    continue;
  }

  const slugSet = new Set<string>();
  const pdfSet = new Set<string>();

  for (const resource of notes) {
    totalResources++;

    if (!resource.slug) {
      logError("Missing slug");
      continue;
    }

    if (slugSet.has(resource.slug)) {
      logError(`Duplicate slug → ${resource.slug}`);
    }

    slugSet.add(resource.slug);

    if (!resource.pdf) {
      logError(`${resource.slug} has no pdf field`);
      continue;
    }

    if (pdfSet.has(resource.pdf)) {
      logError(`Duplicate pdf → ${resource.pdf}`);
    }

    pdfSet.add(resource.pdf);

    const pdfPath = path.join(pdfFolder, resource.pdf);

    if (!fs.existsSync(pdfPath)) {
      logError(`${resource.pdf} not found`);
      continue;
    }

    logSuccess(resource.title);
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📊 Scan Summary");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log(`Classes   : ${totalClasses}`);
console.log(`Resources : ${totalResources}`);
console.log(`Errors    : ${totalErrors}`);

if (totalErrors === 0) {
  console.log("\n🎉 Metadata Scan Passed.");
} else {
  console.log("\n⚠ Metadata Scan Finished With Errors.");
}