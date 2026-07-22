import Link from "next/link";

import type { Reflection } from "@/app/lib/reflection/reflection-types";

interface Props {
  reflections: Reflection[];
}

export default function PendingReflectionWidget({
  reflections,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pending Reflections
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {reflections.length} waiting for review
          </p>
        </div>

        <Link
          href="/admin/reflections"
          className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          View All →
        </Link>

      </div>

      {reflections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center dark:border-slate-700">

          <p className="text-lg font-medium">
            🎉 No pending reflections
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Everything has been moderated.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {reflections.map((reflection) => (
            <div
              key={reflection.id}
              className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {reflection.question}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {reflection.content}
              </p>

              <div className="mt-4 flex items-center justify-between">

                <div className="text-sm text-slate-500">
                  by {reflection.authorName}
                </div>

                <Link
                  href="/admin/reflections"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
                >
                  Review
                </Link>

              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}