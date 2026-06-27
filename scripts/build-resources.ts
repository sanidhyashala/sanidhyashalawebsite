import fs from "fs";
import path from "path";
import { buildResources } from "../storage/resource-builder";

console.log("🚀 Universal Resource Builder v4\n");

const metadataRoot = path.join(
  process.cwd(),
  "storage",
  "metadata"
);

if (!fs.existsSync(metadataRoot)) {
  throw new Error("storage/metadata not found.");
}

const classes = fs
  .readdirSync(metadataRoot)
  .filter((folder) =>
    fs.statSync(path.join(metadataRoot, folder)).isDirectory()
  );

console.log(`Found ${classes.length} classes:\n`);

for (const className of classes) {
  console.log(`➡ ${className}`);
  buildResources(className);
}

console.log("\n🎉 Universal Build Finished Successfully.");