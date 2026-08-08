"use server";

import { readJournalMeta } from "../filesystem/readJournalMeta";
import { writeJournal } from "../services/writeJournal";
import { generateJournal } from "../services/generateJournal";
import { updateJournalRegistry } from "../registry/updateJournalRegistry";

export interface SaveJournalActionInput {
  slug: string;

  hindi: string;

  english: string;
}

export interface SaveJournalActionResult {
  success: boolean;

  message: string;
}

export async function saveJournalAction({
  slug,
  hindi,
  english,
}: SaveJournalActionInput): Promise<SaveJournalActionResult> {

  if (!slug.trim()) {
    return {
      success: false,
      message: "Slug is required.",
    };
  }

  if (!hindi.trim()) {
    return {
      success: false,
      message: "Hindi article is required.",
    };
  }

  if (!english.trim()) {
    return {
      success: false,
      message: "English article is required.",
    };
  }

  try {

    const meta =
      await readJournalMeta(slug);

    const generated =
      await generateJournal({
        slug,

        hindiContent: hindi,

        englishContent: english,

        readingTime:
          meta.readingTime,

        coverImage:
          meta.coverImage,

        featured:
          meta.featured,
      });

    await writeJournal(
      generated
    );

    await updateJournalRegistry();

    return {
      success: true,
      message:
        "Journal saved successfully.",
    };

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save journal.",
    };

  }

}