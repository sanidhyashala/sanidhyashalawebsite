import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { createSubjectiveSet } from "@/app/lib/admin/subjective/subjective-set.actions";

import SubjectiveSetCreationFields from "./components/SubjectiveSetCreationFields";

const CATEGORY_VALUES = [
  "UNDERSTAND_APPLY",
  "THINK_SOLVE",
  "CASE_BASED",
] as const;

type Category =
  (typeof CATEGORY_VALUES)[number];

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export default async function NewSubjectiveSetPage({
  params,
}: PageProps) {
  const { resourceId } = await params;

  const normalizedResourceId =
    resourceId.trim();

  if (!normalizedResourceId) {
    notFound();
  }

  const resources =
    await getAdminLearningResources();

  const resource = resources.find(
    (item) =>
      item.id === normalizedResourceId &&
      item.resource_type === "SUBJECTIVE"
  );

  if (!resource) {
    notFound();
  }

  const chapter =
    resource.curriculum.node?.display_name ?? "—";

  const className =
    resource.curriculum.program?.name ?? "—";

  const session =
    resource.curriculum.version?.session ?? "—";

  /* -------------------------------------------------------
   * Category-wise next Set Numbers
   *
   * Each category has independent numbering:
   *
   * UNDERSTAND_APPLY → 1, 2, 3...
   * THINK_SOLVE      → 1, 2, 3...
   * CASE_BASED       → 1, 2, 3...
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  const {
    data: existingSets,
    error: existingSetsError,
  } = await supabase
    .from("subjective_sets")
    .select("category, set_number")
    .eq("resource_id", resource.id);

  if (existingSetsError) {
    throw new Error(
      `Failed to determine next Subjective Set numbers: ${existingSetsError.message}`
    );
  }

  const nextSetNumbers: Record<
    Category,
    number
  > = {
    UNDERSTAND_APPLY: 1,
    THINK_SOLVE: 1,
    CASE_BASED: 1,
  };

  for (const category of CATEGORY_VALUES) {
    const categorySets =
      existingSets?.filter(
        (set) =>
          set.category === category
      ) ?? [];

    const maxSetNumber =
      categorySets.reduce(
        (max, set) =>
          Math.max(
            max,
            Number(set.set_number) || 0
          ),
        0
      );

    nextSetNumbers[category] =
      maxSetNumber + 1;
  }

  return (
    <AdminPage
      title="Create Subjective Set"
      description="Create a structured Subjective practice set for this resource."
      sectionTitle="Set Details"
      sectionDescription="Choose the category and access type, add your questions after creation, then publish the completed set."
    >
      <div className="mb-8">
        <Link
          href={`/admin/learning/subjective/${resource.id}`}
          className="
            text-sm
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          ← Back to Subjective Sets
        </Link>

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {className}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Session
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {session}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Chapter
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {chapter}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        action={createSubjectiveSet}
        className="max-w-3xl space-y-7"
      >
        <input
          type="hidden"
          name="resource_id"
          value={resource.id}
        />

        {/* Title */}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Set Title
          </label>

          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            placeholder="Example: Set 1 — Concept Practice"
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          />
        </div>

        {/* Category + Access + Automatic Set Number */}

        <SubjectiveSetCreationFields
          nextSetNumbers={nextSetNumbers}
        />

        {/* Description */}

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe what this set is intended to practice."
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          />
        </div>

        {/* Actions */}

        <div className="flex items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
          <button
            type="submit"
            className="
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
            Create Subjective Set
          </button>

          <Link
            href={`/admin/learning/subjective/${resource.id}`}
            className="
              rounded-xl
              border
              border-slate-300
              px-5
              py-3
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
            Cancel
          </Link>
        </div>
      </form>
    </AdminPage>
  );
}