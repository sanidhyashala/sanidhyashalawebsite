import Link from "next/link";

import { getLearningCurriculum } from "@/lib/learning/curriculum";

export default async function NotesPage() {
  const chapters = await getLearningCurriculum("class-11");

  return (
    <main className="px-6 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">

        {/* =====================================================
         * Back to Learning
         * ===================================================== */}

        <div className="mb-8">
          <Link
            href="/learning"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-blue-700
              transition
              hover:text-blue-900
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            ← Back to Learning
          </Link>
        </div>

        {/* =====================================================
         * Notes Header
         * ===================================================== */}

        <header className="mb-10">
          <p
            className="
              mb-3
              text-sm
              font-semibold
              uppercase
              tracking-widest
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
              tracking-tight
              text-blue-900
              dark:text-blue-400
              sm:text-5xl
            "
          >
            Class XI Notes
          </h1>

          <p
            className="
              mt-4
              max-w-3xl
              text-base
              leading-7
              text-slate-600
              dark:text-slate-400
              sm:text-lg
            "
          >
            Chapter-wise notes designed to build conceptual clarity,
            strengthen understanding, and help you learn mathematics
            with depth.
          </p>
        </header>

        {/* =====================================================
         * Notes Overview
         * ===================================================== */}

        <section
          className="
            mb-10
            rounded-3xl
            border
            border-blue-100
            bg-blue-50/70
            p-6
            dark:border-blue-900
            dark:bg-blue-950/30
            sm:p-7
          "
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Learn chapter by chapter
              </p>

              <h2
                className="
                  mt-2
                  text-xl
                  font-bold
                  text-blue-950
                  dark:text-blue-200
                "
              >
                Choose a chapter to explore its notes
              </h2>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-blue-800
                  dark:text-blue-200
                "
              >
                Published notes can be opened directly. New chapters
                will become available here as they are published.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
         * Chapter-wise Notes
         * ===================================================== */}

        <section>
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
              Chapters
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              Explore your notes
            </h2>
          </div>

          <div className="grid gap-4">
            {chapters.map((chapter) => {
              const noteResource =
                chapter.resource_curriculum_nodes
                  ?.flatMap(
                    (mapping) => mapping.resources ?? []
                  )
                  .find(
                    (resource) =>
                      resource.resource_type === "NOTE"
                  );

              const isPublished =
                noteResource?.status === "PUBLISHED";

              const accessType =
                noteResource?.access_type;

              return (
                <article
                  key={chapter.id}
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    shadow-sm
                    transition
                    hover:border-blue-200
                    hover:shadow-md
                    dark:border-slate-800
                    dark:bg-slate-900
                    dark:shadow-none
                    dark:hover:border-blue-800
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-5
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    {/* =================================================
                     * Chapter Information
                     * ================================================= */}

                    <div className="min-w-0">
                      <p
                        className="
                          text-sm
                          font-medium
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Chapter {chapter.sequence_order}
                      </p>

                      <h3
                        className="
                          mt-1
                          text-xl
                          font-bold
                          text-blue-900
                          dark:text-blue-400
                        "
                      >
                        {chapter.display_name}
                      </h3>

                      {chapter.description && (
                        <p
                          className="
                            mt-2
                            max-w-3xl
                            text-sm
                            leading-6
                            text-slate-600
                            dark:text-slate-400
                          "
                        >
                          {chapter.description}
                        </p>
                      )}

                      {/* =================================================
                       * Resource Access Type
                       * ================================================= */}

                      {noteResource && accessType && (
                        <div className="mt-3">
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${
                                accessType === "PREMIUM"
                                  ? `
                                    bg-amber-50
                                    text-amber-700
                                    dark:bg-amber-950/40
                                    dark:text-amber-300
                                  `
                                  : `
                                    bg-blue-50
                                    text-blue-700
                                    dark:bg-blue-950/40
                                    dark:text-blue-300
                                  `
                              }
                            `}
                          >
                            {accessType}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* =================================================
                     * Chapter Action
                     * ================================================= */}

                    <div className="shrink-0">
                      {isPublished && noteResource?.slug ? (
                        <Link
                          href={`/learning/class-11/notes/${noteResource.slug}`}
                          className="
                            inline-flex
                            items-center
                            justify-center
                            rounded-full
                            bg-blue-700
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-blue-800
                            hover:shadow
                            dark:bg-blue-600
                            dark:hover:bg-blue-500
                          "
                        >
                          Explore →
                        </Link>
                      ) : (
                        <span
                          className="
                            inline-flex
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            text-slate-600
                            dark:bg-slate-800
                            dark:text-slate-300
                          "
                        >
                          Not Published
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =====================================================
         * Bottom Navigation
         * ===================================================== */}

        <div
          className="
            mt-10
            border-t
            border-slate-200
            pt-6
            dark:border-slate-800
          "
        >
          <Link
            href="/learning"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-slate-600
              transition
              hover:text-blue-700
              dark:text-slate-400
              dark:hover:text-blue-400
            "
          >
            ← Return to your Learning Space
          </Link>
        </div>
      </div>
    </main>
  );
}