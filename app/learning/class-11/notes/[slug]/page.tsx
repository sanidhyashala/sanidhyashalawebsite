import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import {
  getLearningCurriculum,
  getLearningSubjects,
} from "@/lib/learning/curriculum";

import { getPublishedResourceContent } from "@/lib/learning/content";

import ResourceContentRenderer from "@/components/learning/ResourceContentRenderer";
import ResourceContentPdf from "@/components/learning/ResourceContentPdf";

type NotesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NoteResourcePage({
  params,
}: NotesPageProps) {
  const { slug } = await params;

  // -------------------------------------------------------
  // Authentication
  // -------------------------------------------------------

  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(
        `/learning/class-11/notes/${slug}`,
      )}`,
    );
  }

  // -------------------------------------------------------
  // Resolve Class XI subjects
  // -------------------------------------------------------

  const { subjects } = await getLearningSubjects("class-11");

  // -------------------------------------------------------
  // Find NOTE resource across the Class XI hierarchy
  //
  // Mathematics:
  //   Class XI
  //   └── Mathematics
  //       └── Chapters
  //
  // Science:
  //   Class XI
  //   └── Science
  //       ├── Physics
  //       │   └── Chapters
  //       ├── Chemistry
  //       │   └── Chapters
  //       └── Biology
  //           └── Chapters
  // -------------------------------------------------------

  const noteCandidates = await Promise.all(
    subjects.map(async (subject) => {
      const directChildren = await getLearningCurriculum("class-11", {
        parentNodeId: subject.id,
        includeLockedNotes: true,
      });

      const subjectName = subject.display_name.trim().toLowerCase();

      // ---------------------------------------------------
      // Mathematics
      //
      // Mathematics has chapters directly under the subject.
      // ---------------------------------------------------

      if (subjectName !== "science") {
        return directChildren.flatMap((chapter) =>
          (chapter.resource_curriculum_nodes ?? []).flatMap((mapping) => {
            const resources = Array.isArray(mapping.resources)
              ? mapping.resources
              : mapping.resources
                ? [mapping.resources]
                : [];

            return resources.map((resource) => ({
              resource,
              backHref: "/learning/class-11/notes",
              backLabel: "← Back to Class XI Notes",
            }));
          }),
        );
      }

      // ---------------------------------------------------
      // Science
      //
      // Science has Physics / Chemistry / Biology branches,
      // and chapters exist one level below those branches.
      // ---------------------------------------------------

      return (
        await Promise.all(
          directChildren.map(async (branch) => {
            const branchName = branch.display_name
              .trim()
              .toLowerCase();

            const branchResources = await getLearningCurriculum(
              "class-11",
              {
                parentNodeId: branch.id,
                includeLockedNotes: true,
              },
            );

            return branchResources.flatMap((chapter) =>
              (chapter.resource_curriculum_nodes ?? []).flatMap(
                (mapping) => {
                  const resources = Array.isArray(mapping.resources)
                    ? mapping.resources
                    : mapping.resources
                      ? [mapping.resources]
                      : [];

                  return resources.map((resource) => ({
                    resource,
                    backHref: `/learning?subject=${encodeURIComponent(
                      branchName,
                    )}`,
                    backLabel: `← Back to Class XI ${branch.display_name}`,
                  }));
                },
              ),
            );
          }),
        )
      ).flat();
    }),
  );

  // -------------------------------------------------------
  // Match requested published NOTE
  // -------------------------------------------------------

  const noteMatch = noteCandidates
    .flat()
    .find(
      ({ resource }) =>
        resource.resource_type === "NOTE" &&
        resource.slug === slug &&
        resource.status === "PUBLISHED",
    );

  const noteResource = noteMatch?.resource;

  const noteBackHref =
    noteMatch?.backHref ?? "/learning/class-11/notes";

  const noteBackLabel =
    noteMatch?.backLabel ?? "← Back to Class XI Notes";

  if (!noteResource) {
    notFound();
  }

  // -------------------------------------------------------
  // PDF source
  // -------------------------------------------------------

  if (noteResource.content_source === "PDF") {
    return (
      <main className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href={noteBackHref}
            className="
              mb-8
              inline-flex
              text-sm
              font-semibold
              text-blue-700
              hover:text-blue-900
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            {noteBackLabel}
          </Link>

          <article
            className="
              overflow-hidden
              rounded-3xl
              border
              bg-white
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <header
              className="
                border-b
                p-8
                dark:border-slate-800
              "
            >
              <p
                className="
                  mb-3
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Class XI · Mathematics · 2026–27
              </p>

              <h1
                className="
                  text-4xl
                  font-bold
                  text-blue-900
                  dark:text-blue-400
                "
              >
                {noteResource.title}
              </h1>

              <div
                className="
                  mt-6
                  rounded-2xl
                  bg-blue-50
                  p-5
                  dark:bg-blue-950/40
                "
              >
                <p
                  className="
                    text-sm
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  This learning resource is available as a PDF
                  document.
                </p>
              </div>
            </header>

            <section className="p-4 sm:p-6">
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  dark:border-slate-800
                  dark:bg-slate-950
                "
              >
                <iframe
                  src={`/learning/resources/${noteResource.id}/pdf`}
                  title={noteResource.title}
                  className="
                    h-[80vh]
                    min-h-[700px]
                    w-full
                    border-0
                  "
                />
              </div>

              <div className="mt-4 flex justify-end">
                <a
                  href={`/learning/resources/${noteResource.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-700
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-800
                  "
                >
                  Open PDF →
                </a>
              </div>
            </section>
          </article>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------
  // Editor source
  // -------------------------------------------------------

  const publishedContent = await getPublishedResourceContent(
    noteResource.id,
  );

  // -------------------------------------------------------
  // Resource exists but published content is not available
  // -------------------------------------------------------

  if (!publishedContent) {
    return (
      <main className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href={noteBackHref}
            className="
              mb-8
              inline-flex
              text-sm
              font-semibold
              text-blue-700
              hover:text-blue-900
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            {noteBackLabel}
          </Link>

          <div
            className="
              rounded-3xl
              border
              bg-white
              p-8
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <p
              className="
                mb-3
                text-sm
                font-semibold
                uppercase
                tracking-wider
                text-blue-700
                dark:text-blue-400
              "
            >
              Class XI · Mathematics · 2026–27
            </p>

            <h1
              className="
                text-4xl
                font-bold
                text-blue-900
                dark:text-blue-400
              "
            >
              {noteResource.title}
            </h1>

            <div
              className="
                mt-6
                rounded-2xl
                bg-slate-50
                p-5
                dark:bg-slate-800
              "
            >
              <p
                className="
                  text-sm
                  leading-7
                  text-slate-700
                  dark:text-slate-300
                "
              >
                The learning content for this resource is
                currently being prepared and will be available
                soon.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------
  // Render published Editor content
  // -------------------------------------------------------

  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link
          href={noteBackHref}
          className="
            mb-8
            inline-flex
            text-sm
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          {noteBackLabel}
        </Link>

        <article
          className="
            rounded-3xl
            border
            bg-white
            p-8
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <header
            className="
              border-b
              pb-8
              dark:border-slate-800
            "
          >
            <p
              className="
                mb-3
                text-sm
                font-semibold
                uppercase
                tracking-wider
                text-blue-700
                dark:text-blue-400
              "
            >
              Class XI · Mathematics · 2026–27
            </p>

            <h1
              className="
                text-4xl
                font-bold
                text-blue-900
                dark:text-blue-400
              "
            >
              {noteResource.title}
            </h1>

            <div
              className="
                mt-6
                rounded-2xl
                bg-blue-50
                p-5
                dark:bg-blue-950/40
              "
            >
              <p
                className="
                  text-sm
                  text-slate-700
                  dark:text-slate-300
                "
              >
                This learning resource is published and
                available for students.
              </p>
            </div>
          </header>

          <section className="mt-8">
            <ResourceContentPdf title={noteResource.title}>
              <ResourceContentRenderer
                content={publishedContent.content_json}
              />
            </ResourceContentPdf>
          </section>
        </article>
      </div>
    </main>
  );
}