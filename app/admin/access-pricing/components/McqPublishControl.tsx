"use client";

import { useState } from "react";

import { publishAdminMcqSet } from "@/app/lib/admin/mcq-bank/mcq-set.actions";

type McqPublishControlProps = {
  resourceId: string;
  accessType: "FREE" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  hasActivePrice: boolean;
};

export default function McqPublishControl({
  resourceId,
  accessType,
  status,
  hasActivePrice,
}: McqPublishControlProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isPublished = status === "PUBLISHED";
  const isDraft = status === "DRAFT";
  const premiumPriceMissing =
    accessType === "PREMIUM" && !hasActivePrice;

  async function handlePublish() {
    if (!isDraft || premiumPriceMissing || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setMessage(null);

    try {
      const result = await publishAdminMcqSet(resourceId);

      setMessage(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to publish MCQ Set."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  if (isPublished) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">
          MCQ Set Published
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-700">
          The MCQ Resource and its linked Test are both published.
        </p>
      </div>
    );
  }

  if (status === "ARCHIVED") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">
          MCQ Set Archived
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Archived resources cannot be published from this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Publish MCQ Set
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Publication makes the MCQ Resource and its linked Test visible
          according to the configured access policy.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-slate-700">
              Access:
            </span>

            <span
              className={
                accessType === "PREMIUM"
                  ? "font-semibold text-amber-700"
                  : "font-semibold text-emerald-700"
              }
            >
              {accessType}
            </span>
          </div>

          {accessType === "PREMIUM" && (
            <p className="mt-1 text-xs text-slate-500">
              An active price is required before a Premium MCQ Set can
              be published.
            </p>
          )}
        </div>

        {premiumPriceMissing && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800">
              Active price required
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              Configure an active price above before publishing this
              Premium MCQ Set.
            </p>
          </div>
        )}

        {!premiumPriceMissing && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-sm font-medium text-slate-700">
              Final publication validation
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              The database will verify the linked MCQ Test, question
              snapshots, revisions, options, and publication state
              before publishing.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={
            !isDraft ||
            premiumPriceMissing ||
            isPublishing
          }
          className="
            w-full
            rounded-xl
            bg-slate-900
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isPublishing
            ? "Publishing..."
            : "Publish MCQ Set"}
        </button>

        {message && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm leading-6 text-slate-700">
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}