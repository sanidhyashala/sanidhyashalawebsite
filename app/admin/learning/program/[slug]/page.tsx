import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "../../../components/layout/AdminPage";

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

export default async function AdminLearningProgramPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const normalizedSlug = slug.trim().toLowerCase();

  const classLabel = CLASS_LABELS[normalizedSlug];

  if (!classLabel) {
    notFound();
  }

  const resources = await getAdminLearningResources();

  /*
   * ---------------------------------------------------------
   * Only resources belonging to this program.
   * ---------------------------------------------------------
   */

  const classResources = resources.filter(
    (resource) =>
      resource.curriculum.program?.slug === normalizedSlug
  );

  /*
   * ---------------------------------------------------------
   * Notes only
   *
   * MCQ, Subjective, Case-Based and Mock Test resources
   * are managed through their independent pipelines.
   *
   * This page is intentionally Notes-centric.
   * ---------------------------------------------------------
   */

  const noteResources = classResources.filter(
    (resource) => resource.resource_type === "NOTE"
  );

  /*
   * ---------------------------------------------------------
   * Notes statistics
   * ---------------------------------------------------------
   */

  const totalNotes = noteResources.length;

  const publishedNotes = noteResources.filter(
    (resource) => resource.status === "PUBLISHED"
  ).length;

  const unpublishedNotes = noteResources.filter(
    (resource) => resource.status !== "PUBLISHED"
  ).length;

  const freeNotes = noteResources.filter(
    (resource) => resource.access_type === "FREE"
  ).length;

  const premiumNotes = noteResources.filter(
    (resource) => resource.access_type === "PREMIUM"
  ).length;

  /*
   * ---------------------------------------------------------
   * Session is taken from the actual resource curriculum
   * whenever available.
   * ---------------------------------------------------------
   */

  const session =
    classResources[0]?.curriculum.version?.session ??
    "2026-27";

  return (
    <AdminPage
      title={`${classLabel} Notes`}
      description={`Manage all learning notes for ${classLabel}.`}
      sectionTitle="Notes Overview"
      sectionDescription="Manage chapter-wise notes and monitor their publication and access status."
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
      <div className="space-y-8">
        {/* =====================================================
         * Navigation
         * ===================================================== */}

        <div>
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

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Notes · Chapter-wise learning material
            </p>
          </div>
        </div>

        {/* =====================================================
         * Notes Statistics
         * ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {/* Total Notes */}

          <div
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Notes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {totalNotes}
            </p>
          </div>

          {/* Published */}

          <div
            className="
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50/60
              p-5
              shadow-sm
              dark:border-emerald-900
              dark:bg-emerald-950/20
            "
          >
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-800 dark:text-emerald-300">
              {publishedNotes}
            </p>
          </div>

          {/* Unpublished */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-5
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-950
            "
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Unpublished
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-200">
              {unpublishedNotes}
            </p>
          </div>

          {/* FREE */}

          <div
            className="
              rounded-2xl
              border
              border-blue-200
              bg-blue-50/60
              p-5
              shadow-sm
              dark:border-blue-900
              dark:bg-blue-950/20
            "
          >
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              FREE
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-800 dark:text-blue-300">
              {freeNotes}
            </p>
          </div>

          {/* PREMIUM */}

          <div
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-50/60
              p-5
              shadow-sm
              dark:border-amber-900
              dark:bg-amber-950/20
            "
          >
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              PREMIUM
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-800 dark:text-amber-300">
              {premiumNotes}
            </p>
          </div>
        </div>

        {/* =====================================================
         * Notes Management Card
         * ===================================================== */}

        <div>
          <div className="mb-5">
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-widest
                text-blue-700
                dark:text-blue-400
              "
            >
              Learning Notes
            </p>

            <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              Chapter-wise Notes
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Create, edit, publish and manage notes for this class.
            </p>
          </div>

          <Link
            href={`/admin/learning/program/${normalizedSlug}/notes`}
            className="
              group
              block
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
              dark:hover:border-blue-800
            "
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  📘 Notes
                </h4>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Chapter-wise notes and conceptual learning material.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {totalNotes}{" "}
                    {totalNotes === 1 ? "Note" : "Notes"}
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {publishedNotes} Published
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {unpublishedNotes} Unpublished
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {freeNotes} FREE
                  </span>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {premiumNotes} PREMIUM
                  </span>
                </div>
              </div>

              <span
                className="
                  shrink-0
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  group-hover:text-blue-900
                  dark:text-blue-400
                  dark:group-hover:text-blue-300
                "
              >
                Manage →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </AdminPage>
  );
}