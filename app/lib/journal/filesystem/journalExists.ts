import { promises as fs } from "fs";
import path from "path";

export async function journalExists(
  slug: string
): Promise<boolean> {
  const journalDirectory = path.join(
    process.cwd(),
    "app",
    "content",
    "journal",
    slug
  );

  try {
    await fs.access(journalDirectory);

    return true;
  } catch {
    return false;
  }
}