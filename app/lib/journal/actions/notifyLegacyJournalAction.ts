"use server";

import { notifyLegacyJournal } from "../services/notifyLegacyJournal";

export interface NotifyLegacyJournalActionResult {
  success: boolean;

  message: string;

  recipients?: number;

  delivered?: number;

  failed?: number;
}

export async function notifyLegacyJournalAction(
  slug: string
): Promise<NotifyLegacyJournalActionResult> {
  try {
    const result =
      await notifyLegacyJournal(
        slug
      );

    return {
      success: true,

      message:
        "Community notified successfully.",

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