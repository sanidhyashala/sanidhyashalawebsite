"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Resource {
  title: string;
  slug: string;
}

interface ContinueLearningProps {
  className: string;
  category: string;
  resources: Resource[];
}

export default function ContinueLearning({
  className,
  category,
  resources,
}: ContinueLearningProps) {
  if (resources.length === 0) return null;

  return (
    <section className="mt-12">

      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Continue Learning
        </h2>
        <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400">
          Continue your mathematics journey with the next available learning resources.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        {resources.map((resource) => (

          <Link
            key={resource.slug}
            href={`/reader/${className}/${category}/${resource.slug}`}
            className="
              flex
              flex-col
              justify-between
              min-h-[170px]
              rounded-2xl
              border
              border-slate-200
              dark:border-slate-800
              bg-white
              dark:bg-slate-900
              p-5 md:p-6
              shadow-sm
              dark:shadow-slate-900/40
              transition-all duration-300
              hover:-translate-y-1
              hover:border-blue-300
              dark:hover:border-blue-500
              hover:shadow-xl
              focus-visible:ring-2
              focus-visible:ring-blue-400
              focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-slate-900
            "
          >

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Continue Learning
              </p>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {resource.title}
              </h3>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </div>

          </Link>

        ))}

      </div>

    </section>
  );
}