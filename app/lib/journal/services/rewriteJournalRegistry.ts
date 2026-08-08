import fs from "node:fs";
import path from "node:path";

import { journalRegistry } from "@/app/content/journal/journalRegistry";

import { generateJournalRegistry } from "@/app/lib/journal/registry/generateJournalRegistry";

export async function rewriteJournalRegistry(
  slug: string
): Promise<void> {

  const updatedRegistry =
    journalRegistry.filter(
      (journal) =>
        journal.slug !== slug
    );

  const registrySource =
    generateJournalRegistry(
      updatedRegistry
    );

  const registryPath =
    path.join(
      process.cwd(),
      "app",
      "content",
      "journal",
      "journalRegistry.ts"
    );

  fs.writeFileSync(
    registryPath,
    registrySource,
    "utf8"
  );
}