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
  const [curriculum, resources] =
    await Promise.all([
      getAdminLearningCurriculum(),
      getAdminLearningResources(),
    ]);

  /*
   * -------------------------------------------------------
   * Build class-wise curriculum overview
   * -------------------------------------------------------
   *
   * The database remains the source of truth.
   *
   * We only use program.slug to identify the class.
   */

  const classOverview = new Map<
    string,
    {
      programName: string;
      session: string;
      chapterCount: number;
      resourceCount: number;
    }
  >();

  /*
   * Curriculum → chapter counts
   */

  for (const node of curriculum) {
    const program =
      node.program;

    const version =
      node.curriculum_version;

    if (!program || !version) {
      continue;
    }

    const existing =
      classOverview.get(program.slug);

    if (existing) {
      existing.chapterCount += 1;
    } else {
      classOverview.set(program.slug, {
        programName: program.name,
        session: version.session,
        chapterCount: 1,
        resourceCount: 0,
      });
    }
  }

  /*
   * Resources → resource counts
   */

  for (const resource of resources) {
    const program =
      resource.curriculum.program;

    if (!program) {
      continue;
    }

    const existing =
      classOverview.get(program.slug);

    if (existing) {
      existing.resourceCount += 1;
    }
  }

  /*
   * Only show the classes that actually exist
   * in the curriculum.
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
      title="Learning Resources"
      description="Manage learning resources class-wise from one place."
      sectionTitle="Learning Programs"
      sectionDescription="Choose a class to manage its notes, MCQs, questions and other learning resources."
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
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                {item.session}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {CLASS_LABELS[programSlug] ??
                  item.programName}
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chapters
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {item.chapterCount}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Resources
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {item.resourceCount}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm font-semibold text-blue-700 transition-colors group-hover:text-blue-900 dark:text-blue-400 dark:group-hover:text-blue-300">
                Manage class →
              </p>
            </Link>
          )
        )}
      </div>
    </AdminPage>
  );
}