import Link from "next/link";

import type { ReflectionPrompt } from "@/app/lib/prompt/prompt-types";

interface PromptNavigationProps {
  previousPrompt: ReflectionPrompt | null;
  nextPrompt: ReflectionPrompt | null;

  current: number;
  total: number;
}

export default function PromptNavigation({
  previousPrompt,
  nextPrompt,
  current,
  total,
}: PromptNavigationProps) {
  return (
    <div
      className="
        mb-16
        grid
        grid-cols-3
        items-start
        gap-10

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
        hover:shadow-blue-500/10

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* Previous */}

      <div className="text-left">
        {previousPrompt && (
          <>
            <Link
              href={`/reflection/archive/${previousPrompt.id}`}
              className="
                text-sm
                font-semibold

                text-blue-900
                transition-colors
                duration-300

                hover:text-blue-700

                dark:text-blue-400
                dark:hover:text-blue-300
              "
            >
              ← Previous
            </Link>

            <p
              className="
                mt-3
                text-base
                font-medium
                leading-7

                text-slate-800
                dark:text-slate-100
              "
            >
              {previousPrompt.title}
            </p>
          </>
        )}
      </div>

      {/* Center */}

      <div className="text-center">
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.30em]

            text-blue-700
            dark:text-blue-400
          "
        >
          Reflection Prompt
        </p>

        <p
          className="
            mt-3
            text-3xl
            font-light
            tracking-wide

            text-slate-900
            dark:text-white
          "
        >
          {String(current).padStart(2, "0")}{" "}
          <span className="text-slate-400">/</span>{" "}
          {String(total).padStart(2, "0")}
        </p>
      </div>

      {/* Next */}

      <div className="text-right">
        {nextPrompt && (
          <>
            <Link
              href={`/reflection/archive/${nextPrompt.id}`}
              className="
                text-sm
                font-semibold

                text-blue-900
                transition-colors
                duration-300

                hover:text-blue-700

                dark:text-blue-400
                dark:hover:text-blue-300
              "
            >
              Next →
            </Link>

            <p
              className="
                mt-3
                text-base
                font-medium
                leading-7

                text-slate-800
                dark:text-slate-100
              "
            >
              {nextPrompt.title}
            </p>
          </>
        )}
      </div>
    </div>
  );
}