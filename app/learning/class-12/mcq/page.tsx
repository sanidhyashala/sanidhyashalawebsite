import Link from "next/link";



import {

  getStudentMcqSets,

} from "@/app/lib/learning/mcq.service";



type SubjectGroup = {

  subjectName: string;

  branches: Map<

    string,

    {

      branchName: string | null;

      chapters: Map<

        string,

        {

          chapterName: string;

          chapterSequence: number | null;

          sets: typeof setsPlaceholder;

        }

      >;

    }

  >;

};



type SetType = Awaited<

  ReturnType<typeof getStudentMcqSets>

>[number];



const setsPlaceholder = [] as SetType[];



type MCQPageProps = {
  searchParams?: Promise<{
    subject?: string | string[];
  }>;
};

export default async function MCQPage({
  searchParams,
}: MCQPageProps) {
  const searchParamsValue = searchParams
    ? await searchParams
    : {};

  const requestedSubjectValue =
    searchParamsValue.subject;

  const requestedSubject = Array.isArray(
    requestedSubjectValue
  )
    ? requestedSubjectValue[0] ?? null
    : requestedSubjectValue ?? null;

  const normalizedSubject =
    requestedSubject?.trim().toLowerCase() || null;

  const allSets =
    await getStudentMcqSets("class-12");

  /*
   * -------------------------------------------------------
   * Subject isolation
   * -------------------------------------------------------
   *
   * No query:
   *   Keep the existing class-level MCQ view.
   *
   * mathematics:
   *   Mathematics → Chapters → MCQ Sets
   *
   * physics / chemistry / biology:
   *   Science → Branch → Chapters → MCQ Sets
   *
   * science:
   *   Science → all available branches → Chapters
   *
   * IMPORTANT:
   * An explicit subject must NEVER fall back to another
   * subject. This prevents cross-subject MCQ leakage.
   * -------------------------------------------------------
   */
  const sets =
    !normalizedSubject
      ? allSets
      : normalizedSubject === "mathematics"
        ? allSets.filter(
            (set) =>
              set.subjectName
                .trim()
                .toLowerCase() === "mathematics"
          )
        : normalizedSubject === "science"
          ? allSets.filter(
              (set) =>
                set.subjectName
                  .trim()
                  .toLowerCase() === "science"
            )
          : normalizedSubject === "physics" ||
              normalizedSubject === "chemistry" ||
              normalizedSubject === "biology"
            ? allSets.filter(
                (set) =>
                  set.subjectName
                    .trim()
                    .toLowerCase() === "science" &&
                  set.branchName
                    ?.trim()
                    .toLowerCase() === normalizedSubject
              )
            : [];

  const selectedSubjectLabel =
    normalizedSubject === "mathematics"
      ? "Mathematics"
      : normalizedSubject === "physics"
        ? "Physics"
        : normalizedSubject === "chemistry"
          ? "Chemistry"
          : normalizedSubject === "biology"
            ? "Biology"
            : null;

/* =======================================================

   * Group published MCQ sets by:

   *

   * Subject

   *   └── Branch

   *       └── Chapter

   *

   * Mathematics:

   *   Mathematics

   *      └── Chapter

   *

   * Science:

   *   Science

   *      ├── Physics

   *      │    └── Chapter

   *      ├── Chemistry

   *      │    └── Chapter

   *      └── Biology

   *           └── Chapter

   * ======================================================= */



  const subjects =

    new Map<

      string,

      {

        subjectName: string;

        branches: Map<

          string,

          {

            branchName: string | null;

            chapters: Map<

              string,

              {

                chapterName: string;

                chapterSequence: number | null;

                sets: SetType[];

              }

            >;

          }

        >;

      }

    >();



  for (const set of sets) {

    let subject =

      subjects.get(

        set.subjectName

      );



    if (!subject) {

      subject = {

        subjectName:

          set.subjectName,

        branches:

          new Map(),

      };



      subjects.set(

        set.subjectName,

        subject

      );

    }



    const branchKey =

      set.branchName ??

      "__DIRECT__";



    let branch =

      subject.branches.get(

        branchKey

      );



    if (!branch) {

      branch = {

        branchName:

          set.branchName,

        chapters:

          new Map(),

      };



      subject.branches.set(

        branchKey,

        branch

      );

    }



    let chapter =

      branch.chapters.get(

        set.chapterId

      );



    if (!chapter) {

      chapter = {

        chapterName:

          set.chapterName,

        chapterSequence:

          set.chapterSequence,

        sets: [],

      };



      branch.chapters.set(

        set.chapterId,

        chapter

      );

    }



    chapter.sets.push(

      set

    );

  }



  /* =======================================================

   * Sort subjects

   * ======================================================= */



  const subjectList =

    Array.from(

      subjects.values()

    ).sort(

      (a, b) =>

        a.subjectName.localeCompare(

          b.subjectName

        )

    );



  /* =======================================================

   * Sort branches and chapters

   * ======================================================= */



  for (const subject of subjectList) {

    const sortedBranches =

      Array.from(

        subject.branches.entries()

      ).sort(

        ([keyA, branchA], [keyB, branchB]) => {

          /*

           * Direct subject chapters come first.

           * Example:

           *

           * Mathematics

           *   └── direct chapters

           *

           * Science

           *   └── Physics

           */

          if (

            keyA === "__DIRECT__"

          ) {

            return -1;

          }



          if (

            keyB === "__DIRECT__"

          ) {

            return 1;

          }



          return (

            (branchA.branchName ?? "")

              .localeCompare(

                branchB.branchName ?? ""

              )

          );

        }

      );



    subject.branches =

      new Map(

        sortedBranches

      );



    for (

      const branch of subject.branches.values()

    ) {

      const sortedChapters =

        Array.from(

          branch.chapters.entries()

        ).sort(

          (

            [, chapterA],

            [, chapterB]

          ) =>

            (

              chapterA.chapterSequence ??

              0

            ) -

            (

              chapterB.chapterSequence ??

              0

            )

        );



      branch.chapters =

        new Map(

          sortedChapters

        );

    }

  }



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

            Class XII · MCQ Practice

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

            chapter by chapter. Choose a subject

            and explore its available practice sets.

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

            Subject-wise Practice

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

            Choose a subject to begin

          </h2>



          <p

            className="

              mt-2

              text-sm

              text-slate-600

              dark:text-slate-400

            "

          >

            Explore MCQ practice sets through

            the curriculum structure of Class XII.

          </p>



        </section>



        {/* =================================================

         * Empty State

         * ================================================= */}



        {subjectList.length === 0 ? (



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



            {/* =================================================

             * Subjects

             * ================================================= */}



            <div className="space-y-10">



              {subjectList.map(

                (subject) => (



                  <section

                    key={

                      subject.subjectName

                    }

                    className="

                      rounded-3xl

                      border

                      border-slate-200

                      bg-white

                      p-6

                      shadow-sm

                      dark:border-slate-800

                      dark:bg-slate-900

                      dark:shadow-none

                    "

                  >



                    {/* =================================================

                     * Subject Header

                     * ================================================= */}



                    <div className="mb-6">



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

                        Subject

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

                        {subject.subjectName}

                      </h2>



                    </div>



                    {/* =================================================

                     * Branches

                     * ================================================= */}



                    <div className="space-y-8">



                      {Array.from(

                        subject.branches.values()

                      ).map(

                        (branch) => (



                          <div

                            key={

                              branch.branchName ??

                              "__DIRECT__"

                            }

                          >



                            {/* =================================================

                             * Branch Header

                             * ================================================= */}



                            {branch.branchName && (



                              <div

                                className="

                                  mb-4

                                  rounded-2xl

                                  border

                                  border-blue-100

                                  bg-blue-50/60

                                  px-5

                                  py-4

                                  dark:border-blue-950

                                  dark:bg-blue-950/20

                                "

                              >



                                <p

                                  className="

                                    text-xs

                                    font-semibold

                                    uppercase

                                    tracking-widest

                                    text-blue-700

                                    dark:text-blue-400

                                  "

                                >

                                  Branch

                                </p>



                                <h3

                                  className="

                                    mt-1

                                    text-xl

                                    font-bold

                                    text-slate-900

                                    dark:text-slate-100

                                  "

                                >

                                  {branch.branchName}

                                </h3>



                              </div>



                            )}



                            {/* =================================================

                             * Chapters

                             * ================================================= */}



                            <div className="space-y-3">



                              {Array.from(

                                branch.chapters.entries()

                              ).map(

                                (

                                  [

                                    chapterId,

                                    chapter

                                  ],

                                  chapterIndex

                                ) => (



                                  <Link

                                    key={

                                      chapterId

                                    }

                                    href={
                                      selectedSubjectLabel
                                        ? `/learning/class-12/mcq/${chapterId}?subject=${encodeURIComponent(
                                            normalizedSubject!
                                          )}`
                                        : `/learning/class-12/mcq/${chapterId}`
                                    }

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



                                      {/* =================================================

                                       * Chapter Information

                                       * ================================================= */}



                                      <div>



                                        <p

                                          className="

                                            text-sm

                                            text-slate-500

                                            dark:text-slate-400

                                          "

                                        >

                                          Chapter{" "}

                                          {

                                            chapter.chapterSequence ??

                                            chapterIndex + 1

                                          }

                                        </p>



                                        <h4

                                          className="

                                            mt-1

                                            text-xl

                                            font-semibold

                                            text-blue-900

                                            dark:text-blue-400

                                          "

                                        >

                                          {

                                            chapter.chapterName

                                          }

                                        </h4>



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

                                            {

                                              chapter.sets.length

                                            }{" "}

                                            {

                                              chapter.sets.length ===

                                              1

                                                ? "set"

                                                : "sets"

                                            }

                                          </span>



                                          <span>

                                            {

                                              chapter.sets.reduce(

                                                (

                                                  total,

                                                  set

                                                ) =>

                                                  total +

                                                  set.questionCount,

                                                0

                                              )

                                            }{" "}

                                            questions

                                          </span>



                                        </div>



                                      </div>



                                      {/* =================================================

                                       * Explore Action

                                       * ================================================= */}



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



                          </div>



                        )

                      )}



                    </div>



                  </section>



                )

              )}



            </div>



          </section>



        )}



      </div>

    </main>

  );

}