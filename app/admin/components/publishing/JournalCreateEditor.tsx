"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { createJournalAction } from "@/app/lib/journal/actions/createJournalAction";
import { saveJournalAction } from "@/app/lib/journal/actions/saveJournalAction";
import { parseJournalContent } from "@/app/lib/journal/parser/articleParser";
import { generateMetadata } from "@/app/lib/journal/metadata/metadataEngine";
import { useJournalDraft } from "@/app/lib/journal/draft/useJournalDraft";
import { clearDraft } from "@/app/lib/journal/draft/draftStorage";
import type { JournalPreviewData } from "@/app/lib/journal/preview-types";
import type { JournalFormData } from "@/app/lib/journal/editor-types";
import { generateSlug } from "@/app/lib/journal/slug/slugEngine";

interface JournalEditorProps {
  formData: JournalFormData;
  setFormData: React.Dispatch<React.SetStateAction<JournalFormData>>;
  onPreviewGenerated: (preview: JournalPreviewData) => void;
  onResetForm: () => void;
}

function buildPreview(hindi: string, english: string, readingTime: string): JournalPreviewData {
  const hindiArticle = parseJournalContent(hindi);
  const englishArticle = parseJournalContent(english);

  return {
    readingTime,
    hindi: {
      title: hindiArticle.title,
      subtitle: hindiArticle.subtitle,
      sections: hindiArticle.sections,
    },
    english: {
      title: englishArticle.title,
      subtitle: englishArticle.subtitle,
      sections: englishArticle.sections,
    },
  };
}

export default function JournalEditor({
  formData,
  setFormData,
  onPreviewGenerated,
  onResetForm,
}: JournalEditorProps) {
  const initialState = { message: "", success: false };
  const [state, formAction, isPending] = useActionState(createJournalAction, initialState);

  useEffect(() => {
    if (!state.success) return;
    const timer = setTimeout(() => {
      clearDraft();
      onResetForm();
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.success, onResetForm]);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);

  useJournalDraft({ formData });

  const handlePreview = useCallback(() => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);

      const metadata = generateMetadata(formData.hindi);
      const article = parseJournalContent(formData.hindi);

      setFormData((prev) => {
        const nextSlug = prev.slug || generateSlug(article.title);
        if (
          prev.slug === nextSlug &&
          prev.readingTime === metadata.readingTime &&
          prev.wordCount === metadata.wordCount &&
          prev.sectionCount === metadata.sectionCount
        ) {
          return prev;
        }
        return {
          ...prev,
          slug: nextSlug,
          readingTime: metadata.readingTime,
          wordCount: metadata.wordCount,
          sectionCount: metadata.sectionCount,
        };
      });

      const preview = buildPreview(formData.hindi, formData.english, metadata.readingTime);
      onPreviewGenerated(preview);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setPreviewLoading(false);
    }
  }, [formData.hindi, formData.english, setFormData, onPreviewGenerated]);

  function regenerateSlug() {
    try {
      const article = parseJournalContent(formData.hindi);
      setFormData((prev) => ({ ...prev, slug: generateSlug(article.title) }));
    } catch {
      // Agar article abhi valid format me nahi hai to kuch mat karo.
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");

    try {
      const result = await saveJournalAction({
        slug: formData.slug,
        hindi: formData.hindi,
        english: formData.english,
      });
      setSaveMessage(result.message);
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!formData.hindi.trim()) return;

    try {
      const article = parseJournalContent(formData.hindi);
      const metadata = generateMetadata(formData.hindi);

      setFormData((prev) => {
        const nextSlug = prev.slug || generateSlug(article.title);
        if (
          prev.slug === nextSlug &&
          prev.readingTime === metadata.readingTime &&
          prev.wordCount === metadata.wordCount &&
          prev.sectionCount === metadata.sectionCount
        ) {
          return prev;
        }
        return {
          ...prev,
          slug: nextSlug,
          readingTime: metadata.readingTime,
          wordCount: metadata.wordCount,
          sectionCount: metadata.sectionCount,
        };
      });
    } catch {
      // Invalid formatting ke time metadata update mat karo.
    }
  }, [formData.hindi, setFormData]);

  function updateField(field: keyof JournalFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Slug */}
      <div>
        <label className="mb-2 block text-sm font-medium">Journal Slug</label>
        <input
          name="slug"
          value={formData.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          placeholder="mathematics-is-not-numbers"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      {/* Reading Time */}
      <div>
        <label className="mb-2 block text-sm font-medium">Reading Time</label>
        <input
          name="readingTime"
          value={formData.readingTime}
          onChange={(e) => updateField("readingTime", e.target.value)}
          placeholder="18 min read"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={regenerateSlug}
            disabled={!formData.hindi.trim()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ↻ Regenerate
          </button>
        </div>
      </div>

      {/* Metadata Display */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm">
          <strong>Words:</strong> {formData.wordCount}
        </p>
        <p className="text-sm">
          <strong>Sections:</strong> {formData.sectionCount}
        </p>
      </div>

      {/* Hindi */}
      <div>
        <label className="mb-2 block text-sm font-medium">Hindi Journal</label>
        <textarea
          name="hindi"
          value={formData.hindi}
          onChange={(e) => updateField("hindi", e.target.value)}
          rows={18}
          placeholder="Paste complete Hindi article..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      {/* English */}
      <div>
        <label className="mb-2 block text-sm font-medium">English Journal</label>
        <textarea
          name="english"
          value={formData.english}
          onChange={(e) => updateField("english", e.target.value)}
          rows={18}
          placeholder="Paste complete English article..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      {/* Success / Error (Form Submission) */}
      {state.message && (
        <div
          className={`rounded-xl p-4 text-sm ${
            state.success
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}
      
      {saveMessage && (
        <div className="rounded-xl bg-blue-100 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          {saveMessage}
        </div>
      )}

      {/* Formatting Error (Live Preview Parsing) */}
      {previewError && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
          ⚠️ <strong>Formatting Error:</strong> {previewError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewLoading}
          className="rounded-xl border border-slate-300 px-6 py-3 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {previewLoading ? "Generating Preview..." : "Generate Preview"}
        </button>

        {/* 👇 Ye Save Button wapas add ho gaya hai, isse warnings gayab ho jayengi */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="submit"
          disabled={isPending || !!previewError}
          className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
        >
          {isPending ? "Publishing..." : "Generate Journal"}
        </button>
      </div>
    </form>
  );
}