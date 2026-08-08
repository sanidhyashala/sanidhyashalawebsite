import path from "path";

import { readJournalMeta } from "../filesystem/readJournalMeta";
import { readJournalFile } from "../filesystem/readJournalFile";

import type { JournalMeta } from "../metadata/journalMeta";

export interface LoadedJournal {
  meta: JournalMeta;

  hindi: string;

  english: string;
}

export async function loadJournal(
  slug: string
): Promise<LoadedJournal> {
  const meta =
    await readJournalMeta(slug);

  const journalRoot = path.join(
    "app",
    "content",
    "journal",
    slug
  );

  const hindi =
    await readJournalFile(
      path.join(
        journalRoot,
        "sourceHindi.txt"
      )
    );

  const english =
    await readJournalFile(
      path.join(
        journalRoot,
        "sourceEnglish.txt"
      )
    );

  return {
    meta,
    hindi,
    english,
  };
}