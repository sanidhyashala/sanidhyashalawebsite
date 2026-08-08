import fs from "node:fs";
import path from "node:path";

import { journalRegistry } from "@/app/content/journal/journalRegistry";

import { serializeJournalEntries } from "@/app/lib/journal/generator/serializeJournalEntries";

export async function rewriteJournalEntries(
  slug: string
): Promise<void> {

  const updatedRegistry =
    journalRegistry.filter(
      (journal) =>
        journal.slug !== slug
    );

  const entriesSource =
    serializeJournalEntries(
      updatedRegistry
    );

  const entriesPath =
    path.join(
      process.cwd(),
      "app",
      "content",
      "journal",
      "journalEntries.ts"
    );

  fs.writeFileSync(
    entriesPath,
    entriesSource,
    "utf8"
  );
}