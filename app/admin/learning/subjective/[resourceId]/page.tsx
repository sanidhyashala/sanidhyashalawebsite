import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";
import { getAdminSubjectiveSets } from "@/app/lib/admin/subjective/subjective-set.service";

const CATEGORY_LABELS = {
  UNDERSTAND_APPLY: "Understand & Apply",
  THINK_SOLVE: "Think & Solve",
  CASE_BASED: "Case Based",
} as const;

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export default async function AdminSubjectiveResourcePage({
  params,
}: PageProps) {
  const { resourceId } = await params;

  const normalizedResourceId = resourceId.trim();

  if (!normalizedResourceId) {
    notFound();
  }

  const resources = await getAdminLearningResources();

  const resource = resources.find(
    (item) =>
      item.id === normalizedResourceId &&
      item.resource_type === "SUBJECTIVE"
  );

  if (!resource) {
    notFound();
  }

  const sets = await getAdminSubjectiveSets(
    normalizedResourceId
  );

  const chapterName =
    resource.curriculum.node?.display_name ??
    "Subjective Resource";

  return (
    <AdminPage
      title={resource.title}
      description="Manage Subjective practice sets and their questions."
      sectionTitle="Subjective Sets"
      sectionDescription={`${sets.length} set${
        sets.length === 1 ? "" : "s"
      } currently configured for this resource.`}
      actions={
        <div className="flex items-center gap-3">
          {/* New Set */}

          <Link
            href={`/admin/learning/subjective/${resource.id}/sets/new`}
            className="
              rounded-xl
              bg-slate-900
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            + New Set
          </Link>

          {/* Back to Resources */}

          <Link
            href="/admin/learning"
            className="
              rounded-xl
              border
              border-slate-300
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              dark:border-slate-700
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            ← Resources
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* -------------------------------------------------
         * Resource information
         * ------------------------------------------------- */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div className="grid gap-5 md:grid-cols-4">
            {/* Chapter */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Chapter
              </p>

              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                {chapterName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Chapter{" "}
                {resource.curriculum.node?.sequence_order ?? "—"}
              </p>
            </div>

            {/* Class */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class
              </p>

              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                {resource.curriculum.program?.name ?? "—"}
              </p>
            </div>

            {/* Session */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Session
              </p>

              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                {resource.curriculum.version?.session ?? "—"}
              </p>
            </div>

            {/* Resource Status */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resource Status
              </p>

              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                {resource.status}
              </p>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
         * Subjective Sets
         * ------------------------------------------------- */}

        <div className="space-y-4">
          {sets.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-10
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                No Subjective sets yet.
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This resource is ready for its first Subjective set.
              </p>

              <div className="mt-5">
                <Link
                  href={`/admin/learning/subjective/${resource.id}/sets/new`}
                  className="
                    inline-flex
                    rounded-xl
                    bg-slate-900
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-slate-800
                    dark:bg-white
                    dark:text-slate-900
                    dark:hover:bg-slate-200
                  "
                >
                  + Create First Set
                </Link>
              </div>
            </div>
          ) : (
            sets.map((set) => (
              <div
                key={set.id}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                  shadow-sm
                  dark:border-slate-800
                  dark:bg-slate-900
                "
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {/* Set metadata */}

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="
                          rounded-full
                          bg-blue-50
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-blue-700
                          dark:bg-blue-500/10
                          dark:text-blue-400
                        "
                      >
                        Set {set.setNumber}
                      </span>

                      <span
                        className="
                          rounded-full
                          bg-slate-100
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-slate-700
                          dark:bg-slate-800
                          dark:text-slate-300
                        "
                      >
                        {CATEGORY_LABELS[set.category]}
                      </span>

                      <span
                        className="
                          rounded-full
                          bg-slate-100
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-slate-600
                          dark:bg-slate-800
                          dark:text-slate-400
                        "
                      >
                        {set.accessType}
                      </span>

                      <span
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          ${
                            set.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : set.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }
                        `}
                      >
                        {set.status}
                      </span>
                    </div>

                    {/* Title */}

                    <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                      {set.title}
                    </h3>

                    {/* Description */}

                    {set.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {set.description}
                      </p>
                    )}

                    {/* Question count */}

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {set.questionCount} question
                      {set.questionCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  {/* Open Set */}

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/learning/subjective/${resource.id}/sets/${set.id}`}
                      className="
                        rounded-xl
                        border
                        border-slate-300
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-slate-700
                        transition
                        hover:bg-slate-50
                        dark:border-slate-700
                        dark:text-slate-300
                        dark:hover:bg-slate-800
                      "
                    >
                      Open Set →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminPage>
  );
}