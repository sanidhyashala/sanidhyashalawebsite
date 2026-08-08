import path from "path";

import { writeJournalFile } from "../filesystem/saveFileHelper";
import { removeDirectory } from "../filesystem/removeDirectory";

import type { GeneratedJournal } from "./generateJournal";

export async function writeJournal(
  generated: GeneratedJournal
) {
  const journalFolder = path.join(
    "app",
    "content",
    "journal",
    generated.slug
  );

  try {
    await writeJournalFile(
      path.join(
        journalFolder,
        "articleHindi.ts"
      ),
      generated.hindiTs
    );

    await writeJournalFile(
      path.join(
        journalFolder,
        "articleEnglish.ts"
      ),
      generated.englishTs
    );

    await writeJournalFile(
      path.join(
        journalFolder,
        "meta.ts"
      ),
      generated.metaTs
    );

    await writeJournalFile(
      path.join(
        journalFolder,
        "index.ts"
      ),
      generated.indexTs
    );

    await writeJournalFile(
  path.join(
    journalFolder,
    "journalEntry.ts"
  ),
  generated.journalEntryTs
);

    // ✅ Preserve original source
    await writeJournalFile(
      path.join(
        journalFolder,
        "sourceHindi.txt"
      ),
      generated.sourceHindi
    );

    await writeJournalFile(
      path.join(
        journalFolder,
        "sourceEnglish.txt"
      ),
      generated.sourceEnglish
    );

    return journalFolder;

  } catch (error) {
    await removeDirectory(
      path.resolve(
        process.cwd(),
        journalFolder
      )
    );

    throw error;
  }
}