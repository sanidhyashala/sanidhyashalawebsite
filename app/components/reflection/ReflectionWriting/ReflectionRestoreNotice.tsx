"use client";

import type { ReflectionRestoreNoticeProps } from "./types";

export default function ReflectionRestoreNotice({
  visible,
}: ReflectionRestoreNoticeProps) {
  if (!visible) return null;

  return (
    <div
      className="
        rounded-2xl
        border
        border-emerald-200
        bg-emerald-50
        px-6
        py-4

        shadow-sm

        transition-all
        duration-300

        hover:-translate-y-0.5
        hover:shadow-md

        dark:border-emerald-900/50
        dark:bg-emerald-900/20
        dark:hover:border-emerald-700
        dark:hover:bg-emerald-900/30
      "
    >
      <p
        className="
          text-sm
          font-semibold
          text-emerald-800

          dark:text-emerald-300
        "
      >
        Your previous reflection draft has been restored.
      </p>

      <p
        className="
          mt-2
          text-sm
          leading-6
          text-emerald-700

          dark:text-emerald-400
        "
      >
        Continue writing whenever you are ready.
      </p>
    </div>
  );
}