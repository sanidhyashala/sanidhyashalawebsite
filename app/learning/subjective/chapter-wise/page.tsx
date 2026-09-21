import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getStudentProfile } from "@/lib/learning/student-profile";
import { getLearningCurriculum } from "@/lib/learning/curriculum";

/* =========================================================
 * Subjective Resource Type
 * ========================================================= */

type SubjectiveResource = {
  id: string;
  title: string;
  slug: string;
  resource_type: string;
  access_type: string;
  status: string;
  display_order: number | null;
  content_source: string | null;
};

type ChapterResourceMapping = {
  resource_id: string;
  resources?: SubjectiveResource[] | null;
};

/* =========================================================
 * Chapter Type
 * ========================================================= */

type LearningChapter = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number;
  canonical_node_id: string | null;
  parent_node_id: string | null;
  resource_curriculum_nodes?: ChapterResourceMapping[] | null;
};

export default async function SubjectiveChapterWisePage() {
  /* =====================================================
   * Authentication Gate
   * ===================================================== */

  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section
            className="
              w-full
              rounded-3xl
              border
              border-slate-200
              bg-white
              px-8
              py-12
              text-center
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
              dark:shadow-none
              sm:px-12
            "
          >
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
              Subjective Practice
            </p>

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-blue-900
                dark:text-blue-400
                sm:text-4xl
              "
            >
              Please Sign In to Continue
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-xl
                text-base
                leading-7
                text-slate-600
                dark:text-slate-300
              "
            >
              Sign in to access your chapter-wise
              subjective practice.
            </p>

            <div className="mt-8">
              <Link
                href="/sign-in?redirect_url=/learning/subjective/chapter-wise"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-700
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  hover:bg-blue-800
                  hover:shadow-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:ring-offset-2
                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                  dark:focus:ring-offset-slate-900
                "
              >
                Sign In to Continue →
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Student Profile
   * ===================================================== */

  const profile = await getStudentProfile();

  if (!profile.exists) {
    redirect("/learning/onboarding");
  }

  if (!profile.program_id) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <section
            className="
              rounded-3xl
              border
              border-amber-200
              bg-amber-50
              p-8
              dark:border-amber-900
              dark:bg-amber-950/30
            "
          >
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-widest
                text-amber-700
                dark:text-amber-400
              "
            >
              Subjective Practice
            </p>

            <h1
              className="
                mt-2
                text-2xl
                font-bold
                text-amber-900
                dark:text-amber-300
              "
            >
              Learning program not assigned
            </h1>

            <p
              className="
                mt-3
                leading-7
                text-amber-800
                dark:text-amber-200
              "
            >
              Your student profile is complete, but no
              learning class has been assigned to it yet.
            </p>

            <p
              className="
                mt-2
                text-sm
                text-amber-700
                dark:text-amber-300
              "
            >
              Please contact the administrator to update
              your learning profile.
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Resolve Student's Class
   *
   * We prefer program_slug because it is already provided
   * by getStudentProfile().
   * ===================================================== */

  const classSlug =
    profile.program_slug ??
    getClassSlug(profile.program_name ?? null);

  if (!classSlug) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <section
            className="
              rounded-3xl
              border
              border-red-200
              bg-red-50
              p-8
              dark:border-red-900
              dark:bg-red-950/30
            "
          >
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-widest
                text-red-700
                dark:text-red-400
              "
            >
              Subjective Practice
            </p>

            <h1
              className="
                mt-2
                text-2xl
                font-bold
                text-red-900
                dark:text-red-300
              "
            >
              Unable to determine your class
            </h1>

            <p
              className="
                mt-3
                leading-7
                text-red-800
                dark:text-red-200
              "
            >
              We could not determine the learning class
              associated with your student profile.
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Load Curriculum
   * ===================================================== */

  const chapters =
    (await getLearningCurriculum(
      classSlug
    )) as LearningChapter[];

  /* =====================================================
   * Prepare Subjective Chapter Data
   *
   * Only PUBLISHED SUBJECTIVE resources are available
   * to students.
   *
   * DRAFT / ARCHIVED resources are intentionally excluded
   * from the practice link.
   * ===================================================== */

  const chapterData = chapters
    .map((chapter) => {
      const mappings =
        chapter.resource_curriculum_nodes ?? [];

      const subjectiveResources =
        mappings
          .flatMap(
            (mapping) =>
              mapping.resources ?? []
          )
          .filter(
            (resource) =>
              resource.resource_type ===
                "SUBJECTIVE" &&
              resource.status ===
                "PUBLISHED"
          )
          .sort(
            (a, b) =>
              (a.display_order ?? 0) -
              (b.display_order ?? 0)
          );

      return {
        chapter,
        subjectiveResources,
      };
    })
    .sort(
      (a, b) =>
        a.chapter.sequence_order -
        b.chapter.sequence_order
    );

  /* =====================================================
   * Page
   * ===================================================== */

  return (
    <main className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* =================================================
         * Header
         * ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            px-7
            py-10
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
            sm:px-10
            sm:py-12
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-64
              w-64
              rounded-full
              bg-blue-50
              blur-3xl
              dark:bg-blue-950/30
            "
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="
                  rounded-full
                  bg-blue-50
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                {formatClassName(classSlug)}
              </span>

              {profile.board && (
                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-slate-700
                    dark:bg-slate-800
                    dark:text-slate-300
                  "
                >
                  {profile.board}
                </span>
              )}
            </div>

            <p
              className="
                mt-7
                text-sm
                font-semibold
                uppercase
                tracking-[0.18em]
                text-blue-700
                dark:text-blue-400
              "
            >
              Chapter-wise Practice
            </p>

            <h1
              className="
                mt-3
                text-4xl
                font-bold
                tracking-tight
                text-blue-900
                dark:text-blue-400
                sm:text-5xl
              "
            >
              Choose a chapter.
            </h1>

            <p
              className="
                mt-5
                max-w-3xl
                text-lg
                leading-8
                text-slate-600
                dark:text-slate-300
              "
            >
              Strengthen your understanding chapter by
              chapter through written questions, reasoning,
              application, and thoughtful problem solving.
            </p>
          </div>
        </section>

        {/* =================================================
         * Back Navigation
         * ================================================= */}

        <div>
          <Link
            href="/learning/subjective"
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
            <span>←</span>
            Back to Subjective
          </Link>
        </div>

        {/* =================================================
         * Chapter List
         * ================================================= */}

        <section>
          <div className="mb-6">
            <p
              className="
                text-sm
                font-semibold
                uppercase
                tracking-[0.18em]
                text-blue-700
                dark:text-blue-400
              "
            >
              Explore by chapter
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
                sm:text-3xl
              "
            >
              Your Mathematics chapters
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-base
                leading-7
                text-slate-600
                dark:text-slate-400
              "
            >
              Choose a chapter to explore its available
              subjective practice.
            </p>
          </div>

          {chapterData.length === 0 ? (
            <section
              className="
                rounded-3xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-10
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-2xl
                  dark:bg-blue-500/10
                "
              >
                ✎
              </div>

              <h3
                className="
                  mt-5
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                No chapters available
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-lg
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                No active Mathematics chapters are currently
                available for your learning program.
              </p>
            </section>
          ) : (
            <div className="space-y-5">
              {chapterData.map(
                ({
                  chapter,
                  subjectiveResources,
                }) => {
                  const primaryResource =
                    subjectiveResources[0] ??
                    null;

                  const isAvailable =
                    Boolean(primaryResource);

                  return (
                    <article
                      key={chapter.id}
                      className="
                        rounded-3xl
                        border
                        border-slate-200
                        bg-white
                        p-6
                        shadow-sm
                        transition-all
                        duration-300
                        hover:border-blue-200
                        hover:shadow-md
                        dark:border-slate-800
                        dark:bg-slate-900
                        dark:shadow-none
                        dark:hover:border-blue-800
                        sm:p-7
                      "
                    >
                      <div
                        className="
                          flex
                          flex-col
                          gap-6
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                        "
                      >
                        {/* ---------------------------------
                         * Chapter Information
                         * --------------------------------- */}

                        <div className="flex min-w-0 items-start gap-4">
                          <div
                            className="
                              flex
                              h-12
                              w-12
                              shrink-0
                              items-center
                              justify-center
                              rounded-2xl
                              bg-blue-50
                              text-sm
                              font-bold
                              text-blue-700
                              dark:bg-blue-500/10
                              dark:text-blue-400
                            "
                          >
                            {String(
                              chapter.sequence_order
                            ).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-widest
                                text-blue-600
                                dark:text-blue-400
                              "
                            >
                              Chapter{" "}
                              {chapter.sequence_order}
                            </p>

                            <h3
                              className="
                                mt-1
                                text-xl
                                font-bold
                                leading-7
                                text-slate-900
                                dark:text-slate-100
                                sm:text-2xl
                              "
                            >
                              {chapter.display_name}
                            </h3>

                            {chapter.description && (
                              <p
                                className="
                                  mt-2
                                  max-w-2xl
                                  text-sm
                                  leading-6
                                  text-slate-500
                                  dark:text-slate-400
                                "
                              >
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ---------------------------------
                         * Practice Availability
                         * --------------------------------- */}

                        <div className="shrink-0">
                          {isAvailable ? (
                            <Link
                              href={`/learning/subjective/chapter-wise/${primaryResource.id}`}
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-700
                                px-5
                                py-3
                                text-sm
                                font-semibold
                                text-white
                                shadow-sm
                                transition
                                hover:bg-blue-800
                                hover:shadow-md
                                dark:bg-blue-600
                                dark:hover:bg-blue-500
                              "
                            >
                              Explore Practice
                              <span className="ml-2">
                                →
                              </span>
                            </Link>
                          ) : (
                            <div
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                px-5
                                py-3
                                text-sm
                                font-medium
                                text-slate-500
                                dark:border-slate-700
                                dark:bg-slate-800
                                dark:text-slate-400
                              "
                            >
                              Coming Soon
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ---------------------------------
                       * Availability Detail
                       * --------------------------------- */}

                      <div
                        className="
                          mt-6
                          flex
                          flex-wrap
                          items-center
                          gap-2
                          border-t
                          border-slate-100
                          pt-5
                          dark:border-slate-800
                        "
                      >
                        {isAvailable ? (
                          <>
                            <span
                              className="
                                rounded-full
                                bg-emerald-50
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-emerald-700
                                dark:bg-emerald-500/10
                                dark:text-emerald-400
                              "
                            >
                              Practice Available
                            </span>

                            <span
                              className="
                                rounded-full
                                bg-slate-100
                                px-3
                                py-1.5
                                text-xs
                                font-medium
                                text-slate-600
                                dark:bg-slate-800
                                dark:text-slate-400
                              "
                            >
                              Written Questions
                            </span>
                          </>
                        ) : (
                          <span
                            className="
                              rounded-full
                              bg-amber-50
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              text-amber-700
                              dark:bg-amber-500/10
                              dark:text-amber-400
                            "
                          >
                            Practice will appear when
                            published
                          </span>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =================================================
         * Learning Philosophy
         * ================================================= */}

        <section
          className="
            rounded-3xl
            border
            border-blue-100
            bg-blue-50/70
            p-8
            dark:border-blue-900
            dark:bg-blue-950/20
            sm:p-10
          "
        >
          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.18em]
              text-blue-700
              dark:text-blue-400
            "
          >
            A different kind of practice
          </p>

          <h2
            className="
              mt-3
              text-2xl
              font-bold
              text-blue-900
              dark:text-blue-300
            "
          >
            Do not just find the answer. Build it.
          </h2>

          <p
            className="
              mt-3
              max-w-3xl
              text-base
              leading-7
              text-slate-600
              dark:text-slate-300
            "
          >
            Subjective practice gives you space to explain,
            justify, connect ideas, and learn from the way
            you solve — not merely from whether your final
            answer is right.
          </p>
        </section>

      </div>
    </main>
  );
}

/* =========================================================
 * Class Name Helper
 * ========================================================= */

function getClassSlug(
  className: string | null
): string | null {
  if (!className) {
    return null;
  }

  const match =
    className.match(
      /Class\s+(IX|X|XI|XII)/i
    );

  if (!match) {
    return null;
  }

  const value =
    match[1].toUpperCase();

  const map: Record<
    string,
    string
  > = {
    IX: "class-9",
    X: "class-10",
    XI: "class-11",
    XII: "class-12",
  };

  return map[value] ?? null;
}

/* =========================================================
 * Display Class Name
 * ========================================================= */

function formatClassName(
  classSlug: string
): string {
  const map: Record<
    string,
    string
  > = {
    "class-9": "Class IX",
    "class-10": "Class X",
    "class-11": "Class XI",
    "class-12": "Class XII",
  };

  return (
    map[classSlug] ??
    classSlug
  );
}