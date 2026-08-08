import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

import { supabaseServer } from "@/lib/supabase-server";

export async function writeLegacyNotificationRegistry(
  registry: Record<string, LegacyNotificationRecord>
): Promise<void> {
  const records = Object.entries(registry).map(
    ([slug, record]) => ({
      slug,
      notification_sent_at:
        record.notificationSentAt,
      recipients: record.recipients,
      delivered: record.delivered,
      failed: record.failed,
      updated_at: new Date().toISOString(),
    })
  );

  if (records.length === 0) {
    return;
  }

  const { error } = await supabaseServer
    .from("legacy_notification_history")
    .upsert(records, {
      onConflict: "slug",
    });

  if (error) {
    throw new Error(
      `Failed to write legacy notification history: ${error.message}`
    );
  }
}