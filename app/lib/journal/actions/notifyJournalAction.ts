"use server";

import { notifyJournal } from "../services/notifyJournal";

export interface NotifyJournalActionResult {
  success: boolean;
  message: string;

  recipients?: number;
  delivered?: number;
  failed?: number;
}

export async function notifyJournalAction(
  slug: string,
  resend = false
): Promise<NotifyJournalActionResult> {
  try {
    const result =
      await notifyJournal(
        slug,
        resend
      );

    return {
      success: true,

      message: resend
        ? "Community notified again successfully."
        : "Community notified successfully.",

      recipients:
        result.recipients,

      delivered:
        result.delivered,

      failed:
        result.failed,
    };
  } catch (error) {
    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to notify community.",
    };
  }
}