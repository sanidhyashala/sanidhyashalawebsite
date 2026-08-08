import { promises as fs } from "fs";
import path from "path";

export async function writeJournalFile(
  filePath: string,
  content: string
) {
  const absolutePath = path.resolve(
    process.cwd(),
    filePath
  );

  await fs.mkdir(
    path.dirname(absolutePath),
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    absolutePath,
    content,
    "utf8"
  );

  return absolutePath;
}