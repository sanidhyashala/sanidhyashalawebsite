import Link from "next/link";

import type {
  Reflection,
} from "@/app/lib/reflection/reflection-types";

interface Props {
  reflections: Reflection[];
}

export default function RecentPendingReflections({
  reflections,
}: Props) {
  return (
    <section className="mt-12">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Recent Pending Reflections
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest submissions awaiting moderation
          </p>
        </div>

        <Link
          href="/admin/reflections"
          className="
            rounded-xl
            border
            border-slate-200
            px-4
            py-2
            text-sm
            font-medium

            hover:bg-slate-100

            dark:border-slate-700
            dark:hover:bg-slate-800
          "
        >
          View All
        </Link>

      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

        {reflections.length === 0 ? (

          <div className="p-10 text-center text-slate-500">
            No pending reflections 🎉
          </div>

        ) : (

          reflections.map((reflection) => (

            <div
              key={reflection.id}
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                p-6

                last:border-0

                dark:border-slate-800
              "
            >

              <div className="min-w-0">

                <h3 className="truncate font-medium text-slate-900 dark:text-white">
                  {reflection.question}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {reflection.authorName}
                </p>

              </div>

              <Link
                href="/admin/reflections"
                className="
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2
                  text-sm
                  text-white

                  hover:bg-slate-700

                  dark:bg-white
                  dark:text-slate-900
                "
              >
                Review
              </Link>

            </div>

          ))

        )}

      </div>

    </section>
  );
}