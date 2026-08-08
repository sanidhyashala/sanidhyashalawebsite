"use server";

import { publishJournal } from "../services/publishJournal";

export interface PublishJournalActionResult {
  success: boolean;
  message: string;
}

export async function publishJournalAction(
  slug: string
): Promise<PublishJournalActionResult> {
  try {
    await publishJournal(slug);

    return {
      success: true,
      message: "Journal published successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to publish journal.",
    };
  }
}