"use server";

import { parseJournalContent } from "./parser/articleParser";

import type {
  JournalPreviewData,
} from "./preview-types";

export async function generatePreviewAction(
  formData: FormData
): Promise<JournalPreviewData> {

  const hindi =
    formData.get("hindi")?.toString() ?? "";

  const english =
    formData.get("english")?.toString() ?? "";

  const readingTime =
    formData
      .get("readingTime")
      ?.toString()
      .trim() ?? "";

  if (!hindi) {
    throw new Error(
      "Hindi article is required."
    );
  }

  if (!english) {
    throw new Error(
      "English article is required."
    );
  }

  const hindiArticle =
    parseJournalContent(hindi);

  const englishArticle =
    parseJournalContent(english);

  return {

    readingTime,

    hindi: {
      title:
        hindiArticle.title,

      subtitle:
        hindiArticle.subtitle,

      sections:
        hindiArticle.sections,
    },

    english: {
      title:
        englishArticle.title,

      subtitle:
        englishArticle.subtitle,

      sections:
        englishArticle.sections,
    },

  };
}