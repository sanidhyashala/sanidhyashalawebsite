import { journalArticles } from "@/content/journal";

import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

import {
  createDefaultNotificationRecord,
} from "@/app/lib/journal/legacy/createDefaultNotificationRecord";

import {
  readLegacyNotificationRegistry,
} from "@/app/lib/journal/filesystem/readLegacyNotificationRegistry";

import {
  writeLegacyNotificationRegistry,
} from "@/app/lib/journal/filesystem/writeLegacyNotificationRegistry";

export interface LegacySyncResult {
  total: number;

  added: number;

  removed: number;

  unchanged: number;
}

export async function syncLegacyNotificationRegistry(): Promise<
  LegacySyncResult
> {
  const registry =
    await readLegacyNotificationRegistry();

  const nextRegistry: Record<
    string,
    LegacyNotificationRecord
  > = {};

  let added = 0;

  let unchanged = 0;

  const slugs = Object.keys(
    journalArticles
  ).sort();

  for (const slug of slugs) {
    if (registry[slug]) {
      nextRegistry[slug] =
        registry[slug];

      unchanged++;
    } else {
      nextRegistry[slug] =
        createDefaultNotificationRecord();

      added++;
    }
  }

  const removed = Object.keys(
    registry
  ).filter(
    (slug) =>
      !(slug in journalArticles)
  ).length;

  await writeLegacyNotificationRegistry(
    nextRegistry
  );

  return {
    total: slugs.length,

    added,

    removed,

    unchanged,
  };
}