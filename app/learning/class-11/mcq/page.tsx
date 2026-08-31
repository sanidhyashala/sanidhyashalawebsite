import Link from "next/link";

import {
  getStudentMcqSets,
} from "@/app/lib/learning/mcq.service";

export default async function MCQPage() {
  const sets =
    await getStudentMcqSets("class-11");

  /*
   * =====================================================
   * Group published MCQ Sets by chapter.
   * =====================================================
   */

  const chapters = sets.reduce<
    Map<
      string,
      {
        chapterName: string;
        chapterSequence: number | null;
        chapterId: string;
        sets: typeof sets;
      }
    >
  >((map, set) => {
    const existing =
      map.get(set.chapterId);

    if (existing) {
      existing.sets.push(set);
    } else {
      map.set(set.chapterId, {
        chapterId: set.chapterId,
        chapterName: set.chapterName,
        chapterSequence: set.chapterSequence,
        sets: [set],
      });
    }

    return map;
  }, new Map());

  /*
   * =====================================================
   * Sort chapters according to curriculum sequence.
   * =====================================================
   */

  const chapterList =
    Array.from(chapters.values()).sort(
      (a, b) =>
        (a.chapterSequence ?? 0) -
        (b.chapterSequence ?? 0)
    );

  return (
    <main className="px-6 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
         * Back to Learning
         * ================================================= */}

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


        {/* =================================================
         * MCQ Header
         * ================================================= */}

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
            Class XI MCQ Practice
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
            Chapter-wise multiple choice questions
            designed to strengthen understanding,
            check concepts, and help you practice
            with confidence.
          </p>

        </header>


        {/* =================================================
         * MCQ Overview
         * ================================================= */}

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
            Practice chapter by chapter
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
            Choose a chapter to begin your practice
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
            Choose a chapter to explore its
            published MCQ practice sets and
            begin practicing.
          </p>

        </section>


        {/* =================================================
         * Chapter-wise MCQs
         * ================================================= */}

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


          {chapterList.length === 0 ? (

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
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

            <div className="grid gap-4">

              {chapterList.map(
                (chapter) => (

                  <Link
                    key={chapter.chapterId}
                    href={`/learning/class-11/mcq/${chapter.chapterId}`}
                    className="
                      group
                      block
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-6
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:border-blue-300
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

                      {/* -------------------------------------
                       * Chapter information
                       * ------------------------------------- */}

                      <div className="min-w-0">

                        <p
                          className="
                            text-sm
                            font-medium
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Chapter{" "}
                          {chapter.chapterSequence ??
                            ""}
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
                          {chapter.chapterName}
                        </h3>

                        <p
                          className="
                            mt-2
                            text-sm
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {chapter.sets.length}{" "}
                          practice set
                          {chapter.sets.length === 1
                            ? ""
                            : "s"}{" "}
                          available
                        </p>

                      </div>


                      {/* -------------------------------------
                       * Action
                       * ------------------------------------- */}

                      <span
                        className="
                          shrink-0
                          self-start
                          text-sm
                          font-semibold
                          text-blue-700
                          transition-transform
                          group-hover:translate-x-1
                          dark:text-blue-400
                          sm:self-auto
                        "
                      >
                        Explore →
                      </span>

                    </div>

                  </Link>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
         * Bottom Navigation
         * ================================================= */}

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