import path from "path";

import { writeJournalFile } from "./saveFileHelper";

interface OverwriteSourceFilesInput {
  slug: string;

  hindi: string;

  english: string;
}

export async function overwriteSourceFiles({
  slug,
  hindi,
  english,
}: OverwriteSourceFilesInput) {
  const journalRoot = path.join(
    "app",
    "content",
    "journal",
    slug
  );

  await writeJournalFile(
    path.join(
      journalRoot,
      "sourceHindi.txt"
    ),
    hindi
  );

  await writeJournalFile(
    path.join(
      journalRoot,
      "sourceEnglish.txt"
    ),
    english
  );
}