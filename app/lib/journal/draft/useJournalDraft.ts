"use client";

import {
  useEffect,
} from "react";

import type {
  JournalFormData,
} from "../editor-types";

import {
  saveDraft,
} from "./draftStorage";

interface UseJournalDraftOptions {
  formData: JournalFormData;
}

export function useJournalDraft({
  formData,
}: UseJournalDraftOptions) {

  /*
  ----------------------------------------
  Autosave Draft
  ----------------------------------------
  */

  useEffect(() => {
    saveDraft(formData);
  }, [formData]);

}