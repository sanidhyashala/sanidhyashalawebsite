import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";

const CLASS_LABELS: Record<string, string> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminLearningSubjectivePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const normalizedSlug = slug.trim().toLowerCase();

  const classLabel = CLASS_LABELS[normalizedSlug];

  if (!classLabel) {
    notFound();
  }

  const resources = await getAdminLearningResources();

  const subjectiveResources = resources
    .filter(
      (resource) =>
        resource.curriculum.program?.slug === normalizedSlug &&
        resource.resource_type === "SUBJECTIVE"
    )
    .sort(
      (a, b) =>
        (a.curriculum.node?.sequence_order ?? 0) -
        (b.curriculum.node?.sequence_order ?? 0)
    );

  const session =
    subjectiveResources[0]?.curriculum.version?.session ?? "—";

  return (
    <AdminPage
      title={`${classLabel} Subjective`}
      description={`Manage chapter-wise subjective question resources for ${classLabel}.`}
      sectionTitle="Subjective Resources"
      sectionDescription={`${subjectiveResources.length} subjective resources currently exist for this class.`}
      actions={
        <Link
          href="/admin/learning/new"
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
          + New Resource
        </Link>
      }
    >
      <div className="mb-8">
        <Link
          href={`/admin/learning/program/${normalizedSlug}`}
          className="
            text-sm
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          ← Back to {classLabel} Learning
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            {session}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {classLabel} · Subjective
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Subjective resources contain structured practice sets such as
            Understand & Apply, Think & Solve, and Case Based.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {subjectiveResources.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-white
              p-8
              text-center
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No subjective resources yet.
            </p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create a SUBJECTIVE resource for {classLabel} first.
            </p>
          </div>
        ) : (
          subjectiveResources.map((resource) => (
            <div
              key={resource.id}
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chapter{" "}
                    {resource.curriculum.node?.sequence_order ?? "—"}
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {resource.curriculum.node?.display_name ??
                      resource.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {resource.title}
                  </p>
                </div>

                <div className="flex items-center gap-3">
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
                    {resource.status}
                  </span>

                  <Link
                    href={`/admin/learning/subjective/${resource.id}`}
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
                    Manage Sets →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminPage>
  );
}