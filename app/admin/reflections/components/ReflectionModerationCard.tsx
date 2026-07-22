import type { Reflection } from "@/app/lib/reflection/reflection-types";

import ReflectionStatusBadge from "./ReflectionStatusBadge";
import ReflectionModerationActions from "./ReflectionModerationActions";

interface ReflectionModerationCardProps {
  reflection: Reflection;
}

export default function ReflectionModerationCard({
  reflection,
}: ReflectionModerationCardProps) {
  return (
    <article
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-8
        shadow-sm
        transition-all
        duration-300

        hover:-translate-y-1
        hover:shadow-xl

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* Top */}

      <div className="flex items-start justify-between gap-6">

        <div className="min-w-0 flex-1">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Reflection Question
          </p>

          <h2 className="mt-2 text-2xl font-bold leading-snug text-slate-900 dark:text-white">
            {reflection.question}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">

            <span className="font-medium">
              {reflection.authorName}
            </span>

            <span>•</span>

            <span>
              {new Date(
                reflection.createdAt
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>

          </div>

        </div>

        <ReflectionStatusBadge
          status={reflection.status}
        />

      </div>

      {/* Divider */}

      <div className="my-8 h-px bg-slate-200 dark:bg-slate-800" />

      {/* Reflection */}

      <div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Student Reflection
        </p>

        <div
          className="
            whitespace-pre-wrap
            leading-8
            text-slate-700
            dark:text-slate-300
          "
        >
          {reflection.content}
        </div>

      </div>

      {/* Actions */}

      <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">

        <ReflectionModerationActions
          reflectionId={reflection.id}
        />

      </div>

    </article>
  );
}