import path from "path";

import { writeJournalFile } from "./saveFileHelper";

import type { JournalMeta } from "../metadata/journalMeta";

import { serializeJournalMeta } from "../generator/serializeJournalMeta";

export async function writeJournalMeta(
  meta: JournalMeta
) {
  const filePath = path.join(
    "app",
    "content",
    "journal",
    meta.slug,
    "meta.ts"
  );

  const source =
    serializeJournalMeta(meta);

  await writeJournalFile(
    filePath,
    source
  );
}