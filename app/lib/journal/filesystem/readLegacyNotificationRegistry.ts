import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

import { supabaseServer } from "@/lib/supabase-server";

export async function readLegacyNotificationRegistry(): Promise<
  Record<string, LegacyNotificationRecord>
> {
  const { data, error } = await supabaseServer
    .from("legacy_notification_history")
    .select(
      "slug, notification_sent_at, recipients, delivered, failed"
    );

  if (error) {
    throw new Error(
      `Failed to read legacy notification history: ${error.message}`
    );
  }

  const registry: Record<
    string,
    LegacyNotificationRecord
  > = {};

  for (const record of data ?? []) {
    registry[record.slug] = {
      notificationSentAt:
        record.notification_sent_at,
      recipients: record.recipients,
      delivered: record.delivered,
      failed: record.failed,
    };
  }

  return registry;
}