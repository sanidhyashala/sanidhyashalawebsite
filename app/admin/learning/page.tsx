import Link from "next/link";

import AdminPage from "../components/layout/AdminPage";

import { getAdminLearningCurriculum } from "@/app/lib/admin/learning/learning-curriculum.service";
import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";

const CLASS_ORDER = [
  "class-9",
  "class-10",
  "class-11",
  "class-12",
];

const CLASS_LABELS: Record<string, string> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

export default async function AdminLearningPage() {
  const [curriculum, resources] = await Promise.all([
    getAdminLearningCurriculum(),
    getAdminLearningResources(),
  ]);

  /*
   * -------------------------------------------------------
   * Build class-wise Notes overview
   * -------------------------------------------------------
   *
   * Curriculum gives chapter counts.
   *
   * Resources are filtered strictly to NOTE resources.
   *
   * MCQ, Subjective, Case-Based and Mock Test resources
   * are intentionally ignored.
   */

  const classOverview = new Map<
    string,
    {
      programName: string;
      session: string;
      chapterCount: number;

      noteCount: number;
      publishedNoteCount: number;
      unpublishedNoteCount: number;
      freeNoteCount: number;
      premiumNoteCount: number;
    }
  >();

  /*
   * -------------------------------------------------------
   * Curriculum → chapter counts
   * -------------------------------------------------------
   */

  for (const node of curriculum) {
    const program = node.program;
    const version = node.curriculum_version;

    if (!program || !version) {
      continue;
    }

    const existing = classOverview.get(
      program.slug
    );

    if (existing) {
      existing.chapterCount += 1;
    } else {
      classOverview.set(program.slug, {
        programName: program.name,
        session: version.session,
        chapterCount: 1,

        noteCount: 0,
        publishedNoteCount: 0,
        unpublishedNoteCount: 0,
        freeNoteCount: 0,
        premiumNoteCount: 0,
      });
    }
  }

  /*
   * -------------------------------------------------------
   * Resources → Notes only
   * -------------------------------------------------------
   *
   * A resource is counted once per program.
   *
   * This protects the card counts from duplicate mappings
   * of the same resource to the same class.
   */

  const countedNotesByProgram = new Map<
    string,
    Set<string>
  >();

  for (const resource of resources) {
    if (resource.resource_type !== "NOTE") {
      continue;
    }

    const mappings =
      resource.curriculum.mappings ?? [];

    /*
     * Backward-compatible fallback for any resource that
     * has only the original single curriculum mapping.
     */
    const effectiveMappings =
      mappings.length > 0
        ? mappings
        : resource.curriculum.program
          ? [
              {
                program:
                  resource.curriculum.program,
              },
            ]
          : [];

    const programSlugs = new Set<string>();

    for (const mapping of effectiveMappings) {
      const program =
        mapping.program;

      if (!program) {
        continue;
      }

      programSlugs.add(program.slug);
    }

    for (const programSlug of programSlugs) {
      const existing =
        classOverview.get(programSlug);

      if (!existing) {
        continue;
      }

      /*
       * A resource should contribute only once to the
       * statistics of a particular class.
       */
      const countedResources =
        countedNotesByProgram.get(
          programSlug
        ) ?? new Set<string>();

      if (
        countedResources.has(resource.id)
      ) {
        continue;
      }

      countedResources.add(resource.id);

      countedNotesByProgram.set(
        programSlug,
        countedResources
      );

      /*
       * Total Notes
       */
      existing.noteCount += 1;

      /*
       * Publication status
       */
      if (
        resource.status === "PUBLISHED"
      ) {
        existing.publishedNoteCount += 1;
      } else {
        existing.unpublishedNoteCount += 1;
      }

      /*
       * Access type
       */
      if (
        resource.access_type === "FREE"
      ) {
        existing.freeNoteCount += 1;
      }

      if (
        resource.access_type === "PREMIUM"
      ) {
        existing.premiumNoteCount += 1;
      }
    }
  }

  /*
   * -------------------------------------------------------
   * Only show classes that actually exist in curriculum.
   * -------------------------------------------------------
   */

  const classCards = Array.from(
    classOverview.entries()
  ).sort(
    ([slugA], [slugB]) =>
      CLASS_ORDER.indexOf(slugA) -
      CLASS_ORDER.indexOf(slugB)
  );

  return (
    <AdminPage
      title="Learning Notes"
      description="Manage learning notes class-wise from one place."
      sectionTitle="Learning Programs"
      sectionDescription="Choose a class to manage its chapter-wise notes and monitor their status."
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
          + New Note
        </Link>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {classCards.map(
          ([programSlug, item]) => (
            <Link
              key={programSlug}
              href={`/admin/learning/program/${programSlug}`}
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
              {/* Session */}

              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                {item.session}
              </p>

              {/* Class Name */}

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {CLASS_LABELS[programSlug] ??
                  item.programName}
              </h2>

              {/* Notes Statistics */}

              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* Chapters */}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chapters
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {item.chapterCount}
                  </p>
                </div>

                {/* Total Notes */}

                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Total Notes
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-300">
                    {item.noteCount}
                  </p>
                </div>

                {/* Published */}

                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Published
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-300">
                    {item.publishedNoteCount}
                  </p>
                </div>

                {/* Unpublished */}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unpublished
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-200">
                    {item.unpublishedNoteCount}
                  </p>
                </div>

                {/* FREE */}

                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    FREE
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-300">
                    {item.freeNoteCount}
                  </p>
                </div>

                {/* PREMIUM */}

                <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    PREMIUM
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-300">
                    {item.premiumNoteCount}
                  </p>
                </div>
              </div>

              {/* Navigation */}

              <p className="mt-6 text-sm font-semibold text-blue-700 transition-colors group-hover:text-blue-900 dark:text-blue-400 dark:group-hover:text-blue-300">
                Manage Notes →
              </p>
            </Link>
          )
        )}
      </div>
    </AdminPage>
  );
}