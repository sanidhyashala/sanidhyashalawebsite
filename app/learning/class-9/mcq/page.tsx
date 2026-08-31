import Link from "next/link";

import {
  getStudentMcqSets,
} from "@/app/lib/learning/mcq.service";

export default async function MCQPage() {
  const sets =
    await getStudentMcqSets(
      "class-9"
    );

  /*
   * -------------------------------------------------------
   * Group published MCQ sets by chapter.
   * -------------------------------------------------------
   */

  const chapters =
    sets.reduce<
      Map<
        string,
        {
          chapterName: string;
          chapterSequence: number | null;
          sets: typeof sets;
        }
      >
    >(
      (
        map,
        set
      ) => {
        const existing =
          map.get(
            set.chapterId
          );

        if (existing) {
          existing.sets.push(set);
        } else {
          map.set(
            set.chapterId,
            {
              chapterName:
                set.chapterName,

              chapterSequence:
                set.chapterSequence,

              sets: [set],
            }
          );
        }

        return map;
      },
      new Map()
    );

  /*
   * -------------------------------------------------------
   * Sort chapters according to curriculum sequence.
   * -------------------------------------------------------
   */

  const chapterList =
    Array.from(
      chapters.entries()
    ).sort(
      (
        [, a],
        [, b]
      ) =>
        (a.chapterSequence ?? 0) -
        (b.chapterSequence ?? 0)
    );

  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
         * Page Header
         * ================================================= */}

        <div className="mb-12">

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
            Class IX · Mathematics
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-bold
              tracking-tight
              text-blue-900
              sm:text-5xl
              dark:text-blue-400
            "
          >
            MCQ Practice
          </h1>

          <p
            className="
              mt-4
              max-w-3xl
              text-lg
              leading-8
              text-slate-600
              dark:text-slate-400
            "
          >
            Practice multiple choice questions
            chapter by chapter. Choose a chapter
            to explore its available practice sets.
          </p>

        </div>


        {/* =================================================
         * Chapter-wise Introduction
         * ================================================= */}

        <section
          className="
            mb-10
            rounded-2xl
            border
            border-blue-100
            bg-blue-50/70
            p-6
            dark:border-blue-950
            dark:bg-blue-950/20
          "
        >

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
            Chapter-wise Practice
          </p>

          <h2
            className="
              mt-2
              text-xl
              font-bold
              text-slate-900
              dark:text-slate-100
            "
          >
            Choose a chapter to begin
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-600
              dark:text-slate-400
            "
          >
            Select a chapter to see the MCQ
            practice sets available for it.
          </p>

        </section>


        {/* =================================================
         * Chapters
         * ================================================= */}

        {chapterList.length === 0 ? (

          <div
            className="
              rounded-2xl
              border
              border-dashed
              p-10
              text-center
              text-slate-500
              dark:border-slate-800
              dark:text-slate-400
            "
          >
            No MCQ practice sets are currently
            available.
          </div>

        ) : (

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
                Explore MCQ practice
              </h2>

            </div>


            <div className="space-y-3">

              {chapterList.map(
                (
                  [
                    chapterId,
                    chapter
                  ],
                  chapterIndex
                ) => (

                  <Link
                    key={chapterId}
                    href={`/learning/class-9/mcq/${chapterId}`}
                    className="
                      block
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      transition
                      hover:-translate-y-0.5
                      hover:border-blue-300
                      hover:shadow-md
                      dark:border-slate-800
                      dark:bg-slate-900
                      dark:hover:border-slate-700
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

                      {/* Chapter information */}

                      <div>

                        <p
                          className="
                            text-sm
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Chapter{" "}
                          {chapter.chapterSequence ??
                            chapterIndex + 1}
                        </p>

                        <h3
                          className="
                            mt-1
                            text-xl
                            font-semibold
                            text-blue-900
                            dark:text-blue-400
                          "
                        >
                          {chapter.chapterName}
                        </h3>

                        <div
                          className="
                            mt-2
                            flex
                            flex-wrap
                            gap-x-4
                            gap-y-1
                            text-sm
                            text-slate-500
                            dark:text-slate-400
                          "
                        >

                          <span>
                            {chapter.sets.length}{" "}
                            {chapter.sets.length === 1
                              ? "set"
                              : "sets"}
                          </span>

                          <span>
                            {chapter.sets.reduce(
                              (
                                total,
                                set
                              ) =>
                                total +
                                set.questionCount,
                              0
                            )}{" "}
                            questions
                          </span>

                        </div>

                      </div>


                      {/* Explore action */}

                      <span
                        className="
                          shrink-0
                          font-semibold
                          text-blue-700
                          dark:text-blue-400
                        "
                      >
                        Explore →
                      </span>

                    </div>

                  </Link>

                )
              )}

            </div>

          </section>

        )}

      </div>
    </main>
  );
}