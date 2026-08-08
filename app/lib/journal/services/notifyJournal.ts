import { supabaseServer } from "@/lib/supabase-server";

import { readJournalMeta } from "../filesystem/readJournalMeta";
import { writeJournalMeta } from "../filesystem/writeJournalMeta";

import { updateJournalRegistry } from "../registry/updateJournalRegistry";

import { sendJournalNotification } from "@/app/lib/email/sendJournalNotification";

interface NotifyJournalResult {
  recipients: number;
  delivered: number;
  failed: number;
}

export async function notifyJournal(
  slug: string,
  resend = false
): Promise<NotifyJournalResult> {
  const meta =
    await readJournalMeta(slug);

  if (meta.status !== "published") {
    throw new Error(
      "Only published journals can be notified."
    );
  }

  /*
  ----------------------------------------
  Prevent Duplicate Notification
  ----------------------------------------
  */

  if (
    meta.notificationSentAt &&
    !resend
  ) {
    throw new Error(
      "Community has already been notified."
    );
  }

  /*
  ----------------------------------------
  Subscribers
  ----------------------------------------
  */

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

  /*
  ----------------------------------------
  Send Emails
  ----------------------------------------
  */

  let delivered = 0;

  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      await sendJournalNotification({
        recipient:
          subscriber.email,

        slug: meta.slug,

        title:
          meta.titleEnglish,

        description:
          meta.description,

        readingTime:
          meta.readingTime,
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      delivered++;
    } catch (error) {
      failed++;

      console.error(
        "[Notify Journal]",
        subscriber.email,
        error
      );
    }
  }

  /*
  ----------------------------------------
  Save Notification History
  ----------------------------------------
  */

  await writeJournalMeta({
    ...meta,

    notificationSentAt:
      new Date().toISOString(),

    notificationRecipients:
      subscribers.length,

    notificationDelivered:
      delivered,

    notificationFailed:
      failed,
  });

  /*
  ----------------------------------------
  Refresh Registry
  ----------------------------------------
  */

  await updateJournalRegistry();

  return {
    recipients:
      subscribers.length,

    delivered,

    failed,
  };
}