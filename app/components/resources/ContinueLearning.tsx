"use client";

import Link from "next/link";

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

      <h2 className="mb-6 text-2xl font-bold text-slate-900">
        Continue Learning
      </h2>

      <div className="grid gap-4 md:grid-cols-3">

        {resources.map((resource) => (

          <Link
            key={resource.slug}
            href={`/reader/${className}/${category}/${resource.slug}`}
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:-translate-y-1
              hover:border-blue-300
              hover:shadow-lg
            "
          >

            <p className="mb-2 text-sm text-slate-500">
              Next Chapter
            </p>

            <h3 className="font-semibold text-blue-900">
              {resource.title}
            </h3>

          </Link>

        ))}

      </div>

    </section>
  );
}