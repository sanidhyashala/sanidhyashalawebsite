import { journalRegistry } from "@/app/content/journal/journalRegistry";

import type {
  JournalRegistryItem,
} from "./types";

export async function getJournalRegistry(): Promise<
  JournalRegistryItem[]
> {
  return journalRegistry;
}

export async function getPublishedJournalRegistry(): Promise<
  JournalRegistryItem[]
> {
  return journalRegistry.filter(
    (journal) =>
      journal.status === "published"
  );
}

export async function getJournalBySlug(
  slug: string
): Promise<
  JournalRegistryItem | undefined
> {
  return journalRegistry.find(
    (journal) =>
      journal.slug === slug
  );
}