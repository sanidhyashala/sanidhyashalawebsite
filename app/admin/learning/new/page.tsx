import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import { getAdminLearningCurriculum } from "@/app/lib/admin/learning/learning-curriculum.service";

import { createLearningResource } from "@/app/lib/admin/learning/learning-resource.actions";

const RESOURCE_TYPES = [
  {
    value: "NOTE",
    label: "Notes",
  },
  {
    value: "MCQ",
    label: "MCQ Practice",
  },
  {
    value: "SUBJECTIVE",
    label: "Subjective Questions",
  },
  {
    value: "CASE_BASED",
    label: "Case-Based Questions",
  },
  {
    value: "MOCK_TEST",
    label: "Mock Test",
  },
];

type CurriculumNode = Awaited<
  ReturnType<typeof getAdminLearningCurriculum>
>[number];

/*
 * ---------------------------------------------------------
 * Extract class number from the program slug.
 *
 * Examples:
 * class-9  → 9
 * class-10 → 10
 * class-11 → 11
 * class-12 → 12
 *
 * This is only presentation ordering.
 * Curriculum data itself remains database-driven.
 * ---------------------------------------------------------
 */
function getProgramOrder(
  slug: string
) {
  const match =
    slug.match(/class-(\d+)/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[1]);
}

export default async function NewLearningResourcePage() {
  const curriculum =
    await getAdminLearningCurriculum();

  /*
   * -------------------------------------------------------
   * Group chapters by curriculum version.
   *
   * Each curriculum version belongs to one program/class.
   *
   * Example:
   *
   * Class IX · 2026-27
   *   Chapter 1
   *   Chapter 2
   *   ...
   *
   * Class X · 2026-27
   *   Chapter 1
   *   Chapter 2
   *   ...
   * -------------------------------------------------------
   */

  const curriculumGroups =
    new Map<
      string,
      {
        programId: string;
        programName: string;
        programSlug: string;
        session: string;
        curriculumVersionId: string;
        nodes: CurriculumNode[];
      }
    >();

  for (const node of curriculum) {
    const program =
      node.program;

    const version =
      node.curriculum_version;

    const groupKey =
      version.id;

    const existing =
      curriculumGroups.get(
        groupKey
      );

    if (existing) {
      existing.nodes.push(node);
      continue;
    }

    curriculumGroups.set(
      groupKey,
      {
        programId: program.id,
        programName: program.name,
        programSlug: program.slug,
        session: version.session,
        curriculumVersionId:
          version.id,
        nodes: [node],
      }
    );
  }

  /*
   * -------------------------------------------------------
   * Sort curriculum groups.
   *
   * Primary:
   *   Class number
   *
   * Secondary:
   *   Program name
   *
   * Tertiary:
   *   Session
   *
   * No class names are hard-coded.
   * -------------------------------------------------------
   */

  const sortedGroups =
    Array.from(
      curriculumGroups.values()
    ).sort((a, b) => {
      const classOrderDifference =
        getProgramOrder(
          a.programSlug
        ) -
        getProgramOrder(
          b.programSlug
        );

      if (
        classOrderDifference !== 0
      ) {
        return classOrderDifference;
      }

      const programNameDifference =
        a.programName.localeCompare(
          b.programName,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );

      if (
        programNameDifference !== 0
      ) {
        return programNameDifference;
      }

      return a.session.localeCompare(
        b.session
      );
    });

  /*
   * -------------------------------------------------------
   * Sort chapters inside each curriculum.
   *
   * We create a new array instead of mutating the
   * original service result.
   * -------------------------------------------------------
   */

  const groupsWithSortedNodes =
    sortedGroups.map((group) => ({
      ...group,
      nodes: [...group.nodes].sort(
        (a, b) =>
          (a.sequence_order ?? 0) -
          (b.sequence_order ?? 0)
      ),
    }));

  return (
    <AdminPage
      title="Create Learning Resource"
      description="Create a new learning resource and connect it to the correct curriculum."
      sectionTitle="Resource Details"
      sectionDescription="The resource will be created as a draft. Content can be added and published separately."
    >
      <form
        action={createLearningResource}
        className="max-w-4xl space-y-8"
      >
        {/* -------------------------------------------------
         * Title
         * ------------------------------------------------- */}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Resource Title
          </label>

          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Example: Chapter 1 Notes"
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
              dark:focus:ring-blue-950
            "
          />
        </div>

        {/* -------------------------------------------------
         * Description
         * ------------------------------------------------- */}

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
            placeholder="A short description of this resource."
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
              dark:focus:ring-blue-950
            "
          />
        </div>

        {/* -------------------------------------------------
         * Resource Type
         * ------------------------------------------------- */}

        <div>
          <label
            htmlFor="resource_type"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Resource Type
          </label>

          <select
            id="resource_type"
            name="resource_type"
            required
            defaultValue="NOTE"
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
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          >
            {RESOURCE_TYPES.map(
              (type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              )
            )}
          </select>
        </div>

        {/* -------------------------------------------------
         * Access
         * ------------------------------------------------- */}

        <div>
          <label
            htmlFor="access_type"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Access
          </label>

          <select
            id="access_type"
            name="access_type"
            required
            defaultValue="FREE"
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
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          >
            <option value="FREE">
              Free
            </option>

            <option value="PREMIUM">
              Premium
            </option>
          </select>
        </div>

        {/* -------------------------------------------------
         * Curriculum
         * ------------------------------------------------- */}

        <div>
          <label
            htmlFor="curriculum_node_id"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Curriculum Chapter
          </label>

          <select
            id="curriculum_node_id"
            name="curriculum_node_id"
            required
            defaultValue=""
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
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          >
            <option
              value=""
              disabled
            >
              Select a class and chapter
            </option>

            {groupsWithSortedNodes.map(
              (group) => (
                <optgroup
                  key={
                    group.curriculumVersionId
                  }
                  label={`${group.programName} · ${group.session}`}
                >
                  {group.nodes.map(
                    (node) => (
                      <option
                        key={node.id}
                        value={node.id}
                      >
                        Chapter{" "}
                        {node.sequence_order}:{" "}
                        {node.display_name}
                      </option>
                    )
                  )}
                </optgroup>
              )
            )}
          </select>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Select the exact class, session and
            chapter for this resource.
          </p>
        </div>

        {/* -------------------------------------------------
         * Actions
         * ------------------------------------------------- */}

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
            Create Resource
          </button>

          <Link
            href="/admin/learning"
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