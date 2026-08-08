import path from "path";

import { readJournalMeta } from "../filesystem/readJournalMeta";
import { readJournalFile } from "../filesystem/readJournalFile";

export interface PublishedJournal {
  slug: string;

  meta: Awaited<ReturnType<typeof readJournalMeta>>;

  hindi: string;

  english: string;
}

export async function loadPublishedJournal(
  slug: string
): Promise<PublishedJournal> {
  const meta =
    await readJournalMeta(slug);

  const root = path.join(
    "app",
    "content",
    "journal",
    slug
  );

  const hindi =
    await readJournalFile(
      path.join(
        root,
        "sourceHindi.txt"
      )
    );

  const english =
    await readJournalFile(
      path.join(
        root,
        "sourceEnglish.txt"
      )
    );

  return {
    slug,

    meta,

    hindi,

    english,
  };
}