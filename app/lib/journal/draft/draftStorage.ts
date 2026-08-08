import type { JournalFormData } from "../editor-types";

import {
  emptyJournalForm,
} from "../editor-types";

import {
  JOURNAL_DRAFT_KEY,
} from "./draftKeys";

export function saveDraft(
  data: JournalFormData
) {
  try {
    localStorage.setItem(
      JOURNAL_DRAFT_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error(
      "Failed to save draft",
      error
    );
  }
}

export function loadDraft(): JournalFormData | null {
  try {
    const value =
      localStorage.getItem(
        JOURNAL_DRAFT_KEY
      );

    if (!value) {
      return null;
    }

    const parsed =
      JSON.parse(value);

    return {
      ...emptyJournalForm,
      ...parsed,
    };

  } catch (error) {
    console.error(
      "Failed to load draft",
      error
    );

    clearDraft();

    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(
    JOURNAL_DRAFT_KEY
  );
}