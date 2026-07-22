import Link from "next/link";

import ReflectionCard from "../primitives/ReflectionCard";
import ReflectionMeta from "./ReflectionMeta";

import { Reflection } from "@/app/lib/reflection/reflection-types";

interface ReflectionItemProps {
  reflection: Reflection;
  promptTitle?: string;
}

export default function ReflectionItem({
  reflection,
  promptTitle,
}: ReflectionItemProps) {
  return (
    <ReflectionCard>

      {promptTitle && (
        <div
          className="
            mb-6
            inline-flex
            items-center

            rounded-full

            border
            border-blue-200

            bg-blue-50

            px-4
            py-1.5

            text-xs
            font-semibold
            tracking-[0.15em]
            uppercase

            text-blue-700

            dark:border-blue-500/30
            dark:bg-blue-950/30
            dark:text-blue-300
          "
        >
          {promptTitle}
        </div>
      )}

      <h2
        className="
          text-3xl
          font-semibold
          tracking-tight

          text-blue-900
          dark:text-blue-400
        "
      >
        {reflection.question}
      </h2>

      <p
        className="
          mt-7

          line-clamp-4
          whitespace-pre-line

          text-lg
          leading-9

          text-slate-600
          dark:text-slate-300
        "
      >
        {reflection.content}
      </p>

      <ReflectionMeta
        author={reflection.authorName}
        createdAt={reflection.createdAt}
      />

      <div className="mt-10 flex items-center justify-between">

        <Link
          href={`/reflection/${reflection.id}`}
          className="
            inline-flex
            items-center
            gap-2

            rounded-full

            bg-blue-900

            px-6
            py-3

            text-sm
            font-medium
            text-white

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:bg-blue-800
            hover:shadow-lg
            hover:shadow-blue-500/20

            active:translate-y-0

            dark:bg-blue-600
            dark:hover:bg-blue-500
            dark:hover:shadow-blue-500/30

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:ring-offset-2
            dark:focus-visible:ring-offset-slate-900
          "
        >
          Continue Reading →
        </Link>

      </div>

    </ReflectionCard>
  );
}