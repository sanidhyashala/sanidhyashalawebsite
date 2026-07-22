"use client";

import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ReflectionDraft } from "../types";

const STORAGE_KEY = "sanidhyashala-reflection-draft";

export function useReflectionStorage<
  T extends ReflectionDraft
>(
  draft: T,
  setDraft: Dispatch<SetStateAction<T>>
) {
  const hasInitialized = useRef(false);

  const [wasRestored, setWasRestored] =
    useState(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    hasInitialized.current = true;

    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) return;

      const parsed = JSON.parse(
        saved
      ) as Partial<T>;

      /*
       * Restore ONLY if the draft belongs
       * to the currently active prompt.
       */

      if (
        parsed.promptId &&
        parsed.promptId === draft.promptId
      ) {
        setDraft((prev) => ({
          ...prev,
          content: parsed.content ?? "",
        }));

        setDraft((prev) => ({
  ...prev,
  content: parsed.content ?? "",
}));

requestAnimationFrame(() => {
  setWasRestored(true);
});
      } else {
        /*
         * Prompt changed.
         * Old draft belongs to another reflection.
         */

        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn(
        "Unable to restore reflection draft.",
        error
      );
    }
  }, [draft.promptId, setDraft]);

  useEffect(() => {
    if (!hasInitialized.current) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(draft)
      );
    } catch (error) {
      console.warn(
        "Unable to save reflection draft.",
        error
      );
    }
  }, [draft]);

  return {
    wasRestored,
  };
}

export function clearReflectionDraft() {
  localStorage.removeItem(STORAGE_KEY);
}