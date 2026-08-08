import fs from "node:fs";
import path from "node:path";

export async function deleteJournalFolder(
  slug: string
): Promise<void> {
  const folderPath = path.join(
    process.cwd(),
    "app",
    "content",
    "journal",
    slug
  );

  if (!fs.existsSync(folderPath)) {
    throw new Error(
      `Journal folder "${slug}" does not exist.`
    );
  }

  fs.rmSync(folderPath, {
    recursive: true,
    force: false,
  });
}