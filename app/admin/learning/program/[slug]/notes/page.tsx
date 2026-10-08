import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "../../../../components/layout/AdminPage";

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

export default async function AdminLearningNotesPage({
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
   * ---------------------------------------------------------
   * Only NOTE resources belonging to the selected class.
   *
   * We intentionally use the complete curriculum mappings
   * instead of relying only on the primary mapping.
   * ---------------------------------------------------------
   */

  const notes = resources
    .map((resource) => {
      const mapping =
        resource.curriculum.mappings.find(
          (mapping) =>
            mapping.program?.slug ===
              normalizedSlug &&
            mapping.node?.node_type ===
              "CHAPTER"
        );

      if (!mapping) {
        return null;
      }

      return {
        resource,
        mapping,
      };
    })
    .filter(
      (
        item
      ): item is NonNullable<typeof item> =>
        item !== null &&
        item.resource.resource_type ===
          "NOTE"
    );

  /*
   * ---------------------------------------------------------
   * Session
   * ---------------------------------------------------------
   */

  const session =
    notes[0]?.mapping.version
      ?.session ?? "2026-27";

  /*
   * ---------------------------------------------------------
   * Group notes by their immediate subject.
   *
   * Mathematics:
   *
   *   Chapter 1
   *   Chapter 2
   *
   * Science:
   *
   *   Physics
   *     Chapter 1
   *     Chapter 2
   *
   *   Chemistry
   *     Chapter 1
   *
   *   Biology
   *     Chapter 1
   *
   * The UI does not hard-code subject names.
   * It uses curriculum hierarchy.
   * ---------------------------------------------------------
   */

  const subjectGroups = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      subjectSequence: number;
      notes: typeof notes;
    }
  >();

  for (const item of notes) {
    const subject =
      item.mapping.parent_node;

    /*
     * Safety fallback:
     *
     * A chapter should normally always have a subject
     * parent. If it doesn't, keep it visible under
     * "Uncategorized" instead of silently hiding it.
     */
    const subjectId =
      subject?.id ??
      "uncategorized";

    const subjectName =
      subject?.display_name ??
      "Uncategorized";

    const subjectSequence =
      subject?.sequence_order ??
      Number.MAX_SAFE_INTEGER;

    const existing =
      subjectGroups.get(subjectId);

    if (existing) {
      existing.notes.push(item);
      continue;
    }

    subjectGroups.set(subjectId, {
      subjectId,
      subjectName,
      subjectSequence,
      notes: [item],
    });
  }

  /*
   * ---------------------------------------------------------
   * Sort subjects.
   * ---------------------------------------------------------
   */

  const sortedSubjectGroups =
    Array.from(
      subjectGroups.values()
    ).sort((a, b) => {
      if (
        a.subjectSequence !==
        b.subjectSequence
      ) {
        return (
          a.subjectSequence -
          b.subjectSequence
        );
      }

      return a.subjectName.localeCompare(
        b.subjectName,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      );
    });

  /*
   * ---------------------------------------------------------
   * Sort notes inside each subject.
   * ---------------------------------------------------------
   */

  for (const group of sortedSubjectGroups) {
    group.notes.sort((a, b) => {
      const aSequence =
        a.mapping.node
          ?.sequence_order ??
        Number.MAX_SAFE_INTEGER;

      const bSequence =
        b.mapping.node
          ?.sequence_order ??
        Number.MAX_SAFE_INTEGER;

      if (
        aSequence !== bSequence
      ) {
        return (
          aSequence - bSequence
        );
      }

      const aDisplayOrder =
        a.resource.display_order ?? 0;

      const bDisplayOrder =
        b.resource.display_order ?? 0;

      if (
        aDisplayOrder !==
        bDisplayOrder
      ) {
        return (
          aDisplayOrder -
          bDisplayOrder
        );
      }

      return a.resource.title.localeCompare(
        b.resource.title
      );
    });
  }

  return (
    <AdminPage
      title={`${classLabel} Notes`}
      description={`Manage chapter-wise notes for ${classLabel}.`}
      sectionTitle="Chapter-wise Notes"
      sectionDescription={`${notes.length} note ${
        notes.length === 1
          ? "resource"
          : "resources"
      } currently exist${
        notes.length === 1
          ? "s"
          : ""
      } for this class.`}
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
      {/* -------------------------------------------------
       * Header
       * ------------------------------------------------- */}

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
            {classLabel} · Notes
          </h2>
        </div>
      </div>

      {/* -------------------------------------------------
       * Empty state
       * ------------------------------------------------- */}

      {notes.length === 0 ? (
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
            No note resources yet.
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create the first note resource for{" "}
            {classLabel}.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedSubjectGroups.map(
            (group) => (
              <section
                key={group.subjectId}
                className="space-y-4"
              >
                {/* Subject heading */}

                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-blue-600" />

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {group.subjectName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {group.notes.length}{" "}
                      {group.notes.length === 1
                        ? "note"
                        : "notes"}
                    </p>
                  </div>
                </div>

                {/* Notes */}

                <div className="space-y-4">
                  {group.notes.map(
                    ({
                      resource,
                      mapping,
                    }) => (
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
                        <div
                          className="
                            flex
                            flex-col
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Chapter{" "}
                              {mapping.node
                                ?.sequence_order ??
                                "—"}
                            </p>

                            <Link
                              href={`/admin/learning/${resource.id}`}
                              className="
                                mt-1
                                block
                                text-lg
                                font-bold
                                text-slate-900
                                transition
                                hover:text-blue-700
                                dark:text-white
                                dark:hover:text-blue-400
                              "
                            >
                              {mapping.node
                                ?.display_name ??
                                resource.title}
                            </Link>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {resource.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`
                                rounded-full
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                ${
                                  resource.status ===
                                  "PUBLISHED"
                                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                    : resource.status ===
                                      "DRAFT"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                }
                              `}
                            >
                              {resource.status}
                            </span>

                            <Link
                              href={`/admin/learning/${resource.id}`}
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
                              Open →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </AdminPage>
  );
}