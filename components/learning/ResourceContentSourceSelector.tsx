"use client";

import { useState } from "react";

import { updateLearningResourceContentSource } from "@/app/lib/admin/learning/learning-source.actions";

type ContentSource =
  | "EDITOR"
  | "PDF";

interface Props {
  resourceId: string;
  initialSource: ContentSource;
}

export default function ResourceContentSourceSelector({
  resourceId,
  initialSource,
}: Props) {
  const [source, setSource] =
    useState<ContentSource>(
      initialSource
    );

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleChange(
    nextSource: ContentSource
  ) {
    if (
      saving ||
      nextSource === source
    ) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    const formData =
      new FormData();

    formData.set(
      "resource_id",
      resourceId
    );

    formData.set(
      "content_source",
      nextSource
    );

    try {
      await updateLearningResourceContentSource(
        formData
      );

      setSource(nextSource);
      setSaved(true);
    } catch (error) {
      console.error(
        "Failed to update content source:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update content source."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Student-Facing Content Source
        </p>

        <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
          Choose the primary content
        </h2>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Students will see only the selected
          source for this resource. The other
          source may still exist in the admin
          system, but it will not be presented
          as the primary learning content.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Editor */}

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            handleChange("EDITOR")
          }
          className={`
            rounded-2xl
            border
            p-5
            text-left
            transition
            ${
              source === "EDITOR"
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-950/30 dark:ring-blue-950"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            }
            ${
              saving
                ? "cursor-not-allowed opacity-60"
                : ""
            }
          `}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Editor Content
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Published rich-text content
                rendered directly on the
                student page.
              </p>
            </div>

            <span
              className={`
                mt-1 h-4 w-4 shrink-0 rounded-full border-2
                ${
                  source === "EDITOR"
                    ? "border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                    : "border-slate-300 dark:border-slate-600"
                }
              `}
            />
          </div>
        </button>

        {/* PDF */}

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            handleChange("PDF")
          }
          className={`
            rounded-2xl
            border
            p-5
            text-left
            transition
            ${
              source === "PDF"
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-950/30 dark:ring-blue-950"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            }
            ${
              saving
                ? "cursor-not-allowed opacity-60"
                : ""
            }
          `}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Uploaded PDF
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                The active PDF uploaded through
                the admin PDF system.
              </p>
            </div>

            <span
              className={`
                mt-1 h-4 w-4 shrink-0 rounded-full border-2
                ${
                  source === "PDF"
                    ? "border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                    : "border-slate-300 dark:border-slate-600"
                }
              `}
            />
          </div>
        </button>
      </div>

      <div className="mt-5 min-h-5">
        {saving && (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Saving content source...
          </p>
        )}

        {!saving && saved && (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Content source updated successfully.
          </p>
        )}

        {!saving && error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}