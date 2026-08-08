import { promises as fs } from "fs";
import path from "path";

export async function readJournalFile(
  filePath: string
) {
  const absolutePath = path.resolve(
    process.cwd(),
    filePath
  );

  return fs.readFile(
    absolutePath,
    "utf8"
  );
}