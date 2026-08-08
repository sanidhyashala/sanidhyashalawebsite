import fs from "node:fs";
import path from "node:path";

import { journalRegistry } from "@/app/content/journal/journalRegistry";

export interface DeletePlan {
  slug: string;

  folderPath: string;

  registryPath: string;

  journalEntriesPath: string;
}

export async function buildDeletePlan(
  slug: string
): Promise<DeletePlan> {
  const journal = journalRegistry.find(
    (item) => item.slug === slug
  );

  if (!journal) {
    throw new Error(
      `Journal "${slug}" does not exist.`
    );
  }

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

  return {
    slug,

    folderPath,

    registryPath: path.join(
      process.cwd(),
      "app",
      "content",
      "journal",
      "journalRegistry.ts"
    ),

    journalEntriesPath: path.join(
      process.cwd(),
      "app",
      "content",
      "journal",
      "journalEntries.ts"
    ),
  };
}