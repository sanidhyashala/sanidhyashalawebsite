"use client";

import { useState, useTransition } from "react";

import { updateLearningResourceAccessType } from "@/app/lib/admin/learning/learning-resource.actions";

type AccessType = "FREE" | "PREMIUM";

type ResourceAccessTypeControlProps = {
  resourceId: string;
  initialAccessType: AccessType;
};

export default function ResourceAccessTypeControl({
  resourceId,
  initialAccessType,
}: ResourceAccessTypeControlProps) {
  const [accessType, setAccessType] =
    useState<AccessType>(initialAccessType);

  const [isPending, startTransition] =
    useTransition();

  const handleChange = (
    nextAccessType: AccessType
  ) => {
    if (
      nextAccessType === accessType ||
      isPending
    ) {
      return;
    }

    const previousAccessType = accessType;

    setAccessType(nextAccessType);

    const formData = new FormData();

    formData.set(
      "resource_id",
      resourceId
    );

    formData.set(
      "access_type",
      nextAccessType
    );

    startTransition(async () => {
      try {
        await updateLearningResourceAccessType(
          formData
        );
      } catch (error) {
        console.error(
          "Failed to update resource access type:",
          error
        );

        setAccessType(
          previousAccessType
        );
      }
    });
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            handleChange("FREE")
          }
          disabled={isPending}
          className={[
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            accessType === "FREE"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
            isPending
              ? "cursor-not-allowed opacity-60"
              : "",
          ].join(" ")}
        >
          FREE
        </button>

        <button
          type="button"
          onClick={() =>
            handleChange("PREMIUM")
          }
          disabled={isPending}
          className={[
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            accessType === "PREMIUM"
              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
            isPending
              ? "cursor-not-allowed opacity-60"
              : "",
          ].join(" ")}
        >
          PREMIUM
        </button>
      </div>

      {isPending && (
        <p className="text-xs text-slate-500">
          Saving access type…
        </p>
      )}
    </div>
  );
}