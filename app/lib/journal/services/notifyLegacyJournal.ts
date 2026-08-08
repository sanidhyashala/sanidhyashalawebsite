import { journalArticles } from "@/content/journal";

import { supabaseServer } from "@/lib/supabase-server";

import { sendLegacyJournalNotification } from "@/app/lib/email/sendLegacyJournalNotification";

import { writeLegacyNotification } from "../filesystem/writeLegacyNotification";

interface NotifyLegacyJournalResult {
  recipients: number;

  delivered: number;

  failed: number;
}

export async function notifyLegacyJournal(
  slug: string
): Promise<NotifyLegacyJournalResult> {
  const journal =
    journalArticles[slug];

  if (!journal) {
    throw new Error(
      "Legacy journal not found."
    );
  }

  const {
    data: subscribers,
    error,
  } = await supabaseServer
    .from("newsletter_subscribers")
    .select("email");

  if (error) {
    throw error;
  }

  if (
    !subscribers ||
    subscribers.length === 0
  ) {
    return {
      recipients: 0,
      delivered: 0,
      failed: 0,
    };
  }

  let delivered = 0;

  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      await sendLegacyJournalNotification({
        recipient:
          subscriber.email,

        slug,

        title:
          journal.meta.title,

        description:
          journal.meta.description,

        readingTime:
          journal.meta.readingTime,
      });

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 150)
      );

      delivered++;
    } catch (error) {
      failed++;

      console.error(
        "[Legacy Notify]",
        subscriber.email,
        error
      );
    }
  }

  await writeLegacyNotification(
    slug,
    {
      notificationSentAt:
        new Date().toISOString(),

      recipients:
        subscribers.length,

      delivered,

      failed,
    }
  );

  return {
    recipients:
      subscribers.length,

    delivered,

    failed,
  };
}