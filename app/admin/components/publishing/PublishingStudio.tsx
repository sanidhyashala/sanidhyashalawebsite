"use client";

import { useState, useEffect } from "react";
import DraftRecoveryBanner from "./DraftRecoveryBanner";

import JournalEditor from "./JournalCreateEditor";
import JournalPreview from "./JournalPreview";

import type { JournalPreviewData } from "@/app/lib/journal/preview-types";

import {
  emptyJournalForm,
} from "@/app/lib/journal/editor-types";

import type {
  JournalFormData,
} from "@/app/lib/journal/editor-types";

import {
  loadDraft,
  clearDraft,
} from "@/app/lib/journal/draft/draftStorage";

import { parseJournalContent } from "@/app/lib/journal/parser/articleParser";
import { generateMetadata } from "@/app/lib/journal/metadata/metadataEngine";

// 👇 Clean Utility Function for checking content
function hasDraftContent(draft: JournalFormData): boolean {
  return Boolean(
    (draft.hindi && draft.hindi.trim() !== "") ||
    (draft.english && draft.english.trim() !== "") ||
    (draft.slug && draft.slug.trim() !== "")
  );
}

export default function PublishingStudio() {
  const [formData, setFormData] = useState<JournalFormData>(emptyJournalForm);

  const [preview, setPreview] = useState<JournalPreviewData>({
    readingTime: "",
    hindi: {
      title: "Hindi Preview",
      subtitle: "Hindi preview will appear here.",
      sections: [],
    },
    english: {
      title: "English Preview",
      subtitle: "English preview will appear here.",
      sections: [],
    },
  });

  const [activeLanguage, setActiveLanguage] = useState<"hindi" | "english">("hindi");

  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savedDraft, setSavedDraft] = useState<JournalFormData | null>(null);

  // 👇 Pro-level naming: isReady ki jagah isHydrated
  const [isHydrated, setIsHydrated] = useState(false);

  function restorePreviewFromDraft(draft: JournalFormData) {
    try {
      const hindi = parseJournalContent(draft.hindi);
      const english = parseJournalContent(draft.english);
      const metadata = generateMetadata(draft.hindi);

      setPreview({
        readingTime: metadata.readingTime,
        hindi: {
          title: hindi.title,
          subtitle: hindi.subtitle,
          sections: hindi.sections,
        },
        english: {
          title: english.title,
          subtitle: english.subtitle,
          sections: english.sections,
        },
      });
    } catch {
      // preview ko ignore kar do
    }
  }

  function resetPublishingStudio() {
    setFormData(emptyJournalForm);
    setPreview({
      readingTime: "",
      hindi: {
        title: "Hindi Preview",
        subtitle: "Hindi preview will appear here.",
        sections: [],
      },
      english: {
        title: "English Preview",
        subtitle: "English preview will appear here.",
        sections: [],
      },
    });
    setActiveLanguage("hindi");
  }

  useEffect(() => {
    const draft = loadDraft();

    if (draft && hasDraftContent(draft)) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }

    // Draft process hone ke baad hydration complete
    setIsHydrated(true);
  }, []);

  function continueDraft() {
    if (!savedDraft) return;

    setFormData(savedDraft);
    restorePreviewFromDraft(savedDraft);
    setDraftLoaded(true);
    setShowDraftBanner(false);
  }

  function discardDraft() {
    clearDraft();
    resetPublishingStudio();
    setDraftLoaded(true);
    setShowDraftBanner(false);
  }

  return (
    <>
      {showDraftBanner && !draftLoaded && (
        <DraftRecoveryBanner
          onContinue={continueDraft}
          onDiscard={discardDraft}
        />
      )}

      {!isHydrated ? (
        <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="animate-pulse text-sm font-medium text-slate-400">
            Initializing Studio...
          </span>
        </div>
      ) : (
        <section className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <JournalEditor
              formData={formData}
              setFormData={setFormData}
              onPreviewGenerated={setPreview}
              onResetForm={resetPublishingStudio}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveLanguage("hindi")}
                className={`rounded-lg px-4 py-2 text-sm ${
                  activeLanguage === "hindi"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 dark:border-slate-700"
                }`}
              >
                हिन्दी
              </button>

              <button
                type="button"
                onClick={() => setActiveLanguage("english")}
                className={`rounded-lg px-4 py-2 text-sm ${
                  activeLanguage === "english"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 dark:border-slate-700"
                }`}
              >
                English
              </button>
            </div>

            <JournalPreview
              title={preview[activeLanguage].title}
              subtitle={preview[activeLanguage].subtitle}
              readingTime={preview.readingTime}
              sections={preview[activeLanguage].sections}
            />
          </div>
        </section>
      )}
    </>
  );
}