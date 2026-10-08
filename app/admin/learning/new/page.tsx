import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import { getAdminLearningCurriculum } from "@/app/lib/admin/learning/learning-curriculum.service";
import { createLearningResource } from "@/app/lib/admin/learning/learning-resource.actions";
import LearningCurriculumSelector from "./LearningCurriculumSelector";

type CurriculumNode = Awaited<
  ReturnType<typeof getAdminLearningCurriculum>
>[number];

/* =========================================================
 * Extract class number from the program slug.
 * ========================================================= */

function getProgramOrder(slug: string) {
  const match = slug.match(/class-(\d+)/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[1]);
}

/* =========================================================
 * Page
 * ========================================================= */

export default async function NewLearningResourcePage() {
  const curriculum = await getAdminLearningCurriculum();

  /* =======================================================
   * Group curriculum by curriculum version.
   * ======================================================= */

  const curriculumGroups = new Map<
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
    const program = node.program;
    const version = node.curriculum_version;

    const groupKey = version.id;

    const existing = curriculumGroups.get(groupKey);

    if (existing) {
      existing.nodes.push(node);
      continue;
    }

    curriculumGroups.set(groupKey, {
      programId: program.id,
      programName: program.name,
      programSlug: program.slug,
      session: version.session,
      curriculumVersionId: version.id,
      nodes: [node],
    });
  }

  /* =======================================================
   * Sort curriculum groups.
   * ======================================================= */

  const sortedGroups = Array.from(
    curriculumGroups.values(),
  ).sort((a, b) => {
    const classOrderDifference =
      getProgramOrder(a.programSlug) -
      getProgramOrder(b.programSlug);

    if (classOrderDifference !== 0) {
      return classOrderDifference;
    }

    const programNameDifference =
      a.programName.localeCompare(
        b.programName,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );

    if (programNameDifference !== 0) {
      return programNameDifference;
    }

    return a.session.localeCompare(b.session);
  });

  /* =======================================================
   * Build curriculum hierarchy.
   *
   * Mathematics:
   *
   *   Mathematics
   *      └── Chapter
   *
   * Science:
   *
   *   Science
   *      ├── Physics
   *      │     └── Chapter
   *      ├── Chemistry
   *      │     └── Chapter
   *      └── Biology
   *            └── Chapter
   *
   * The hierarchy is determined from parent_node_id and
   * child relationships. Nothing is hard-coded.
   * ======================================================= */

  const groupsWithSubjects = sortedGroups.map(
    (group) => {
      const subjectNodes = group.nodes
        .filter(
          (node) =>
            node.node_type === "SUBJECT",
        )
        .sort(
          (a, b) =>
            (a.sequence_order ?? 0) -
            (b.sequence_order ?? 0),
        );

      const subjectGroups = subjectNodes
        .map((subject) => {
          const directChildren = group.nodes
            .filter(
              (node) =>
                node.parent_node_id ===
                subject.id,
            )
            .sort(
              (a, b) =>
                (a.sequence_order ?? 0) -
                (b.sequence_order ?? 0),
            );

          /* -------------------------------------------------
           * Direct child with no children = Chapter
           * Direct child with children = Branch
           * ------------------------------------------------- */

          const chapters = directChildren.filter(
            (child) => {
              const hasChildren =
                group.nodes.some(
                  (node) =>
                    node.parent_node_id ===
                    child.id,
                );

              return !hasChildren;
            },
          );

          const branches = directChildren
            .map((child) => {
              const branchChapters =
                group.nodes
                  .filter(
                    (node) =>
                      node.parent_node_id ===
                      child.id,
                  )
                  .sort(
                    (a, b) =>
                      (a.sequence_order ?? 0) -
                      (b.sequence_order ?? 0),
                  );

              if (
                branchChapters.length === 0
              ) {
                return null;
              }

              return {
                id: child.id,
                display_name:
                  child.display_name,
                sequence_order:
                  child.sequence_order,
                chapters:
                  branchChapters,
              };
            })
            .filter(
              (
                branch,
              ): branch is NonNullable<
                typeof branch
              > => branch !== null,
            );

          return {
            subject,
            chapters,
            branches,
          };
        })
        .filter(
          (subjectGroup) =>
            subjectGroup.chapters.length > 0 ||
            subjectGroup.branches.length > 0,
        );

      /* =====================================================
       * Track all correctly mapped chapter IDs.
       * ===================================================== */

      const mappedChapterIds = new Set(
        subjectGroups.flatMap(
          (subjectGroup) => [
            ...subjectGroup.chapters.map(
              (chapter) =>
                chapter.id,
            ),

            ...subjectGroup.branches.flatMap(
              (branch) =>
                branch.chapters.map(
                  (chapter) =>
                    chapter.id,
                ),
            ),
          ],
        ),
      );

      /* =====================================================
       * Safety fallback for orphan chapter nodes.
       * ===================================================== */

      const chapterNodes =
        group.nodes.filter(
          (node) =>
            node.node_type === "CHAPTER" &&
            !group.nodes.some(
              (child) =>
                child.parent_node_id ===
                node.id,
            ),
        );

      const unmappedChapters =
        chapterNodes
          .filter(
            (chapter) =>
              !mappedChapterIds.has(
                chapter.id,
              ),
          )
          .sort(
            (a, b) =>
              (a.sequence_order ?? 0) -
              (b.sequence_order ?? 0),
          );

      return {
        ...group,
        subjectGroups,
        unmappedChapters,
      };
    },
  );

  return (
    <AdminPage
      title="Create Learning Note"
      description="Create a new learning note and connect it to the correct curriculum."
      sectionTitle="Note Details"
      sectionDescription="The note will be created as a draft. Content can be added and published separately."
    >
      <form
        action={createLearningResource}
        className="max-w-4xl space-y-8"
      >
        {/* =================================================
            Title
        ================================================= */}

        <div>
          <label
            htmlFor="title"
            className="
              block
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Note Title
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

        {/* =================================================
            Description
        ================================================= */}

        <div>
          <label
            htmlFor="description"
            className="
              block
              text-sm
              font-semibold
              text-slate-800
              dark:text-slate-200
            "
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="A short description of this note."
            className="
              mt-2
              w-full
              resize-none
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-sm
              leading-6
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

        {/* =================================================
            Curriculum Mapping
        ================================================= */}

        <div>
          <div className="mb-3">
            <p
              className="
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              Curriculum Mapping
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              Select the exact class, subject,
              branch when applicable, and chapter
              for this note.
            </p>
          </div>

          <LearningCurriculumSelector
            groups={groupsWithSubjects}
          />
        </div>

        {/* =================================================
            Actions
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
            border-t
            border-slate-200
            pt-6
            dark:border-slate-800
          "
        >
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
            Create Note
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