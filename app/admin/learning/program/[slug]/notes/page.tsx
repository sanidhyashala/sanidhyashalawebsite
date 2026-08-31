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
   * Only NOTE resources belonging to
   * the selected class.
   */

  const notes = resources
    .filter(
      (resource) =>
        resource.curriculum.program?.slug ===
          normalizedSlug &&
        resource.resource_type === "NOTE"
    )
    .sort(
      (a, b) =>
        (a.curriculum.node
          ?.sequence_order ?? 0) -
        (b.curriculum.node
          ?.sequence_order ?? 0)
    );

  const session =
    notes[0]?.curriculum.version
      ?.session ?? "2026-27";

  return (
    <AdminPage
      title={`${classLabel} Notes`}
      description={`Manage chapter-wise notes for ${classLabel}.`}
      sectionTitle="Chapter-wise Notes"
      sectionDescription={`${notes.length} note resources currently exist for this class.`}
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
            {classLabel} · Notes
          </h2>
        </div>
      </div>

      <div className="space-y-4">
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
          notes.map((note) => (
            <div
              key={note.id}
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
                    {note.curriculum.node
                      ?.sequence_order ?? "—"}
                  </p>

                  <Link
                    href={`/admin/learning/${note.id}`}
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
                    {note.curriculum.node
                      ?.display_name ??
                      note.title}
                  </Link>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {note.title}
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
                        note.status ===
                        "PUBLISHED"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : note.status ===
                            "DRAFT"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    {note.status}
                  </span>

                  <Link
                    href={`/admin/learning/${note.id}`}
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
          ))
        )}
      </div>
    </AdminPage>
  );
}