import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

import {
  readLegacyNotificationRegistry,
} from "./readLegacyNotificationRegistry";

import {
  writeLegacyNotificationRegistry,
} from "./writeLegacyNotificationRegistry";

export async function writeLegacyNotification(
  slug: string,
  record: LegacyNotificationRecord
): Promise<void> {
  const registry =
    await readLegacyNotificationRegistry();

  registry[slug] = record;

  await writeLegacyNotificationRegistry(
    registry
  );
}