import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "../../../components/layout/AdminPage";

import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";

const RESOURCE_TYPES = [
  {
    type: "NOTE",
    route: "notes",
    label: "📘 Notes",
    description:
      "Chapter-wise notes and conceptual learning material.",
  },
  {
    type: "MCQ",
    route: "mcq",
    label: "📝 MCQ Practice",
    description:
      "Multiple choice questions for practice and assessment.",
  },
  {
    type: "SUBJECTIVE",
    route: "subjective",
    label: "✍️ Subjective Questions",
    description:
      "Short-answer and long-answer questions.",
  },
  {
    type: "CASE_BASED",
    route: "case-based",
    label: "📖 Case-Based Questions",
    description:
      "Competency-based and case-study resources.",
  },
  {
    type: "MOCK_TEST",
    route: "mock-test",
    label: "🧪 Mock Tests",
    description:
      "Full-length and practice assessment resources.",
  },
] as const;

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

export default async function AdminLearningProgramPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const normalizedSlug =
    slug.trim().toLowerCase();

  const classLabel =
    CLASS_LABELS[normalizedSlug];

  if (!classLabel) {
    notFound();
  }

  const resources =
    await getAdminLearningResources();

  /*
   * Only resources belonging to this program.
   */

  const classResources =
    resources.filter(
      (resource) =>
        resource.curriculum.program?.slug ===
        normalizedSlug
    );

  /*
   * Session is taken from the actual resource
   * curriculum whenever available.
   */

  const session =
    classResources[0]?.curriculum.version
      ?.session ?? "2026-27";

  return (
    <AdminPage
      title={`${classLabel} Learning`}
      description={`Manage all learning resources for ${classLabel}.`}
      sectionTitle="Resource Categories"
      sectionDescription="Choose a resource type to view and manage its chapter-wise resources."
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
          href="/admin/learning"
          className="
            text-sm
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          ← Back to Learning Programs
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            {session}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {classLabel}
          </h2>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {RESOURCE_TYPES.map(
          (resourceType) => {
            const count =
              classResources.filter(
                (resource) =>
                  resource.resource_type ===
                  resourceType.type
              ).length;

            return (
              <Link
                key={resourceType.type}
                href={`/admin/learning/program/${normalizedSlug}/${resourceType.route}`}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-blue-200
                  hover:shadow-lg
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:hover:border-slate-700
                "
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {resourceType.label}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {resourceType.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {count}{" "}
                    {count === 1
                      ? "Resource"
                      : "Resources"}
                  </span>

                  <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-900 dark:text-blue-400 dark:group-hover:text-blue-300">
                    Manage →
                  </span>
                </div>
              </Link>
            );
          }
        )}
      </div>
    </AdminPage>
  );
}