import Link from "next/link";

import ReflectionCard from "./primitives/ReflectionCard";

import type { ReflectionPrompt } from "@/app/lib/prompt/prompt-types";

interface FeaturedReflectionProps {
  prompt: ReflectionPrompt;
}

export default function FeaturedReflection({
  prompt,
}: FeaturedReflectionProps) {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <ReflectionCard>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
            A Question Worth Keeping
          </p>

          <p className="mt-8 text-xl italic text-slate-600 dark:text-slate-400">
            Some questions are more valuable than their answers.
          </p>

          <h2 className="mt-8 text-4xl font-semibold leading-tight text-blue-900 dark:text-blue-400 md:text-5xl">
            {prompt.title}
          </h2>

          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            2 min reflection
          </p>

          <div className="mt-12 space-y-6 text-lg leading-9 text-slate-600 dark:text-slate-400">
            <p>{prompt.description}</p>
          </div>

          <blockquote className="mt-14 border-l-4 border-blue-200 pl-6 text-xl italic text-slate-900 dark:border-blue-800 dark:text-slate-100">
            There is no correct response here. Only an honest one.
          </blockquote>

          <div className="mt-16">
            <Link
              href="#reflection-writing"
              className="
                inline-flex
                rounded-full
                border
                border-blue-200
                px-8
                py-3
                text-base
                font-medium
                transition-all
                duration-300

                hover:border-blue-900
hover:bg-blue-900

dark:hover:border-blue-400
dark:hover:bg-blue-400
dark:hover:text-slate-950
                hover:text-white

                dark:border-blue-800
                dark:hover:border-slate-100
                dark:hover:bg-slate-100
                dark:hover:text-slate-900
              "
            >
              Share Your Reflection →
            </Link>
          </div>
        </ReflectionCard>
      </div>
    </section>
  );
}