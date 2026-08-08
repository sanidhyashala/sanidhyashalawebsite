"use server";

import { publishJournal } from "../services/createJournal";

// Interfaces export karne me koi dikkat nahi hai
export interface CreateJournalActionResult {
  success: boolean;
  slug?: string;
  message: string;
}

// ❌ Yahan se initialState hata diya gaya hai

export async function createJournalAction(
  _previousState: CreateJournalActionResult,
  formData: FormData
): Promise<CreateJournalActionResult> {
  const slug =
    formData.get("slug")?.toString().trim() ?? "";

  const hindi =
    formData.get("hindi")?.toString().trim() ?? "";

  const english =
    formData.get("english")?.toString() ?? "";

  const readingTime =
    formData
      .get("readingTime")
      ?.toString()
      .trim() ?? "";

  if (!slug) {
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
    await publishJournal({
      slug,
      hindiContent: hindi,
      englishContent: english,
      readingTime,
    });

    return {
      success: true,
      slug,
      message:
        "Journal generated successfully.",
    };
  } catch (error) {
    // 👇 Sirf ye line update ki hai better production debugging ke liye
    console.error("[Journal Publish]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate journal.",
    };
  }
}