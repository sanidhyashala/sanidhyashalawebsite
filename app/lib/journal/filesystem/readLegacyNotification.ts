import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

import { readLegacyNotificationRegistry } from "./readLegacyNotificationRegistry";

export async function readLegacyNotification(
  slug: string
): Promise<LegacyNotificationRecord> {
  const registry =
    await readLegacyNotificationRegistry();

  const notification =
    registry[slug];

  if (!notification) {
    throw new Error(
      `Legacy notification not found for "${slug}".`
    );
  }

  return notification;
}