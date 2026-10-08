import Link from "next/link";

import { notFound, redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";



import { getStudentProfile } from "@/lib/learning/student-profile";

import { getLearningCurriculum } from "@/lib/learning/curriculum";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";



import { startSubjectiveAttempt } from "@/app/lib/learning/subjective/subjective-attempt.actions";



/* =========================================================

 * Types

 * ========================================================= */



type SubjectiveSet = {

  id: string;

  resource_id: string;

  category:

    | "UNDERSTAND_APPLY"

    | "THINK_SOLVE"

    | "CASE_BASED";

  title: string;

  description: string | null;

  set_number: number;

  display_order: number | null;

  status: string;

  access_type: "FREE" | "PREMIUM";

};



type SubjectiveSetQuestion = {

  question_id: string;

  question_revision_id: string;

  question_order: number;

  marks: number;

};



type SubjectiveAttempt = {

  id: string;

  set_id: string;

  attempt_number: number;

  attempt_type: "INITIAL" | "PREMIUM_RETRY";

  status:

    | "IN_PROGRESS"

    | "SUBMITTED"

    | "LOCKED"

    | "EVALUATED"

    | "ABANDONED";

};



type LearningResource = {

  id: string;

  title: string;

  slug: string;

  resource_type: string;

  access_type: string;

  status: string;

  display_order: number | null;

  content_source: string | null;

};



type LearningChapter = {

  id: string;

  display_name: string;

  description: string | null;

  sequence_order: number;

  canonical_node_id: string | null;

  parent_node_id: string | null;



  resource_curriculum_nodes?: {

    resource_id: string;



    /*

     * Supabase nested relation can arrive as either:

     * - a single object

     * - an array

     * - null

     *

     * We normalize it before using .find().

     */

    resources?: LearningResource | LearningResource[] | null;

  }[] | null;

};



/* =========================================================

 * Category Meta

 * ========================================================= */



const CATEGORY_META = {

  UNDERSTAND_APPLY: {

    label: "Understand & Apply",

    description:

      "Build conceptual clarity and apply what you understand through written mathematical practice.",

    icon: "◫",

  },



  THINK_SOLVE: {

    label: "Think & Solve",

    description:

      "Strengthen reasoning, connections, and mathematical problem-solving beyond routine questions.",

    icon: "✦",

  },



  CASE_BASED: {

    label: "Case Based",

    description:

      "Apply mathematical ideas to contextual and competency-based situations.",

    icon: "▣",

  },

} as const;



/* =========================================================

 * Page Props

 * ========================================================= */



type PageProps = {

  params: Promise<{

    setId: string;

  }>;

};



/* =========================================================

 * Page

 * ========================================================= */



export default async function SubjectiveSetPage({

  params,

}: PageProps) {

  /* =====================================================

   * Authentication

   * ===================================================== */



  const { isAuthenticated, userId } = await auth();



  const { setId } = await params;



  if (!isAuthenticated || !userId) {

    redirect(

      `/sign-in?redirect_url=${encodeURIComponent(

        `/learning/subjective/sets/${setId}`

      )}`

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

              Your student profile is complete,

              but no learning class has been assigned

              to it yet.

            </p>

          </section>

        </div>

      </main>

    );

  }



  /* =====================================================

   * Resolve Student Class

   * ===================================================== */



  const classSlug =

    profile.program_slug ??

    getClassSlug(profile.program_name ?? null);



  if (!classSlug) {

    notFound();

  }



  /* =====================================================

   * Load Student Curriculum

   *

   * This gives us the allowed published Subjective

   * resources for the student's own class.

   * ===================================================== */



  const chapters = (await getLearningCurriculum(

    classSlug

  )) as LearningChapter[];



  /* =====================================================

   * Supabase

   * ===================================================== */



  const supabase = await createLearningSupabaseClient();



  /* =====================================================

   * Load Subjective Set

   * ===================================================== */



  const { data: set, error: setError } = await supabase

    .from("subjective_sets")

    .select(

      `

        id,

        resource_id,

        category,

        title,

        description,

        set_number,

        display_order,

        status,

        access_type

      `

    )

    .eq("id", setId)

    .eq("status", "PUBLISHED")

    .maybeSingle();



  if (setError) {

    throw new Error(

      `Failed to load Subjective set: ${setError.message}`

    );

  }



  if (!set) {

    notFound();

  }



  const subjectiveSet = set as SubjectiveSet;



  /* =====================================================
   * Validate Resource Against Student Curriculum
   *
   * Mathematics: Mathematics -> Chapter -> Resource
   * Science: Science -> Physics/Chemistry/Biology -> Chapter -> Resource
   * ===================================================== */

  const findResourceInChapters = (
    chaptersToSearch: LearningChapter[]
  ): { chapter: LearningChapter; resource: LearningResource } | null => {
    for (const chapter of chaptersToSearch) {
      const mappings = chapter.resource_curriculum_nodes ?? [];

      for (const mapping of mappings) {
        const resources = Array.isArray(mapping.resources)
          ? mapping.resources
          : mapping.resources
            ? [mapping.resources]
            : [];

        const resource = resources.find(
          (item) =>
            item.id === subjectiveSet.resource_id &&
            item.resource_type === "SUBJECTIVE" &&
            item.status === "PUBLISHED"
        );

        if (resource) return { chapter, resource };
      }
    }

    return null;
  };

  // First check the immediate curriculum level (e.g. Mathematics -> Chapters).
  let curriculumMatch = findResourceInChapters(chapters);

  // Science has one extra level: Science -> Physics/Chemistry/Biology -> Chapters.
  if (!curriculumMatch) {
    const scienceBranchNames = new Set([
      "physics",
      "chemistry",
      "biology",
    ]);

    for (const branch of chapters) {
      const branchName = branch.display_name.trim().toLowerCase();

      if (!scienceBranchNames.has(branchName)) continue;

      const branchChapters = (
        (await getLearningCurriculum(classSlug, {
          parentNodeId: branch.id,
          includeLockedNotes: false,
        })) as LearningChapter[]
      );

      curriculumMatch = findResourceInChapters(branchChapters);

      if (curriculumMatch) break;
    }
  }

  let matchedChapter: LearningChapter | null = null;
  let matchedResource: LearningResource | null = null;

  if (curriculumMatch) {
    matchedChapter = curriculumMatch.chapter;
    matchedResource = curriculumMatch.resource;
  }

  if (!matchedChapter || !matchedResource) {
    notFound();
  }

  /* =====================================================

   * Access Type

   * ===================================================== */



  const isPremium =

    subjectiveSet.access_type === "PREMIUM";



  /* =====================================================

   * Load Set Questions

   *

   * IMPORTANT:

   *

   * The existing RLS policy on subjective_set_questions

   * remains the final access boundary.

   *

   * FREE:

   *   Published questions can be returned.

   *

   * PREMIUM without entitlement:

   *   RLS returns no question rows.

   *

   * PREMIUM with entitlement:

   *   Published questions are returned normally.

   * ===================================================== */



  const {

    data: setQuestions,

    error: questionError,

  } = await supabase

    .from("subjective_set_questions")

    .select(

      `

        question_id,

        question_revision_id,

        question_order,

        marks

      `

    )

    .eq("set_id", subjectiveSet.id)

    .order("question_order", {

      ascending: true,

    });



  if (questionError) {

    throw new Error(

      `Failed to load Subjective set questions: ${questionError.message}`

    );

  }



  const questions =

    (setQuestions ?? []) as SubjectiveSetQuestion[];



  /*

   * For FREE Sets, access is automatically available.

   *

   * For PREMIUM Sets, the existing question-level RLS

   * determines whether the authenticated student can

   * actually see the question rows.

   *

   * A published PREMIUM Set with zero questions returned

   * therefore represents a locked state for this page.

   *

   * Premium Sets are protected again at attempt-start time

   * by the existing server action / DB RPC.

   */

  const hasPremiumContentAccess =

    !isPremium || questions.length > 0;



  const canAccessSet =

    !isPremium || hasPremiumContentAccess;



  /* =====================================================

   * Load Existing Student Attempts

   *

   * Attempts are only loaded when the student actually

   * has access to the Set.

   * ===================================================== */



  let attempts: SubjectiveAttempt[] = [];



  if (canAccessSet) {

    const {

      data: existingAttempts,

      error: attemptsError,

    } = await supabase

      .from("subjective_attempts")

      .select(

        `

          id,

          set_id,

          attempt_number,

          attempt_type,

          status

        `

      )

      .eq("set_id", subjectiveSet.id)

      .eq("user_id", userId)

      .order("attempt_number", {

        ascending: false,

      });



    if (attemptsError) {

      throw new Error(

        `Failed to load Subjective attempts: ${attemptsError.message}`

      );

    }



    attempts =

      (existingAttempts ?? []) as SubjectiveAttempt[];

  }



  const latestAttempt = attempts[0] ?? null;



  const attemptOne =

    attempts.find(

      (attempt) => attempt.attempt_number === 1

    ) ?? null;



  const attemptTwo =

    attempts.find(

      (attempt) => attempt.attempt_number === 2

    ) ?? null;



  /* =====================================================

   * Attempt State

   * ===================================================== */



  const isAttemptInProgress =

    latestAttempt?.status === "IN_PROGRESS";



  const isCompletedStatus = (

    status:

      | SubjectiveAttempt["status"]

      | undefined

  ) =>

    status === "SUBMITTED" ||

    status === "LOCKED" ||

    status === "EVALUATED";



  const hasCompletedAttemptOne =

    isCompletedStatus(attemptOne?.status);



  const hasCompletedAttemptTwo =

    isCompletedStatus(attemptTwo?.status);



  /*

   * FREE:

   * Attempt 1 is the only available attempt.

   */

  const isFreeCompleted =

    !isPremium &&

    hasCompletedAttemptOne;



  /*

   * PREMIUM:

   * Attempt 1 completed means Attempt 2 is available.

   */

  const isPremiumRetryAvailable =

    isPremium &&

    canAccessSet &&

    hasCompletedAttemptOne &&

    !attemptTwo;



  /*

   * PREMIUM:

   * Attempt 2 completed means all attempts are consumed.

   */

  const isPremiumCompleted =

    isPremium &&

    canAccessSet &&

    hasCompletedAttemptTwo;



  /* =====================================================

   * Calculate Set Summary

   * ===================================================== */



  const questionCount = questions.length;



  const totalMarks = questions.reduce(

    (total, question) =>

      total + Number(question.marks ?? 0),

    0

  );



  const category =

    CATEGORY_META[subjectiveSet.category];



  /* =====================================================

   * Determine CTA State

   * ===================================================== */



  let primaryAction:

    | "START"

    | "CONTINUE"

    | "RETRY"

    | "REVIEW"

    | "LOCKED";



  let primaryLabel: string;



  let primaryAttemptId: string | null = null;



  /*

   * Priority:

   *

   * 1. Premium without entitlement -> Locked

   * 2. IN_PROGRESS -> Continue

   * 3. Premium Attempt 1 complete -> Retry

   * 4. Completed -> Review

   * 5. No attempt -> Start

   */



  if (isPremium && !canAccessSet) {

    primaryAction = "LOCKED";

    primaryLabel = "Unlock Premium Practice";

  } else if (isAttemptInProgress) {

    primaryAction = "CONTINUE";

    primaryLabel = "Continue Practice";

    primaryAttemptId =

      latestAttempt?.id ?? null;

  } else if (isPremiumRetryAvailable) {

    primaryAction = "RETRY";

    primaryLabel = "Start Practice Again";

  } else if (

    isFreeCompleted ||

    isPremiumCompleted

  ) {

    primaryAction = "REVIEW";

    primaryLabel =

      "Review Submitted Answer";

    primaryAttemptId =

      latestAttempt?.id ?? null;

  } else {

    primaryAction = "START";

    primaryLabel = "Start Practice";

  }



  /* =====================================================

   * Page

   * ===================================================== */



  return (

    <main className="px-6 py-12 sm:py-16">

      <div className="mx-auto max-w-5xl space-y-8">



        {/* =================================================

         * Back Navigation

         * ================================================= */}



        <div>

          <Link

            href={`/learning/subjective/chapter-wise/${encodeURIComponent(

              subjectiveSet.resource_id

            )}`}

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

            Back to Chapter

          </Link>

        </div>



        {/* =================================================

         * Set Header

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

              h-72

              w-72

              rounded-full

              bg-blue-50

              blur-3xl

              dark:bg-blue-950/30

            "

          />



          <div className="relative">



            {/* -------------------------------------------

             * Chapter

             * ------------------------------------------- */}



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

                Chapter {matchedChapter.sequence_order}

              </span>



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

                {matchedChapter.display_name}

              </span>

            </div>



            {/* -------------------------------------------

             * Category

             * ------------------------------------------- */}



            <div

              className="

                mt-8

                flex

                items-center

                gap-3

              "

            >

              <div

                className="

                  flex

                  h-11

                  w-11

                  items-center

                  justify-center

                  rounded-2xl

                  bg-blue-50

                  text-lg

                  font-bold

                  text-blue-700

                  dark:bg-blue-500/10

                  dark:text-blue-400

                "

              >

                {category.icon}

              </div>



              <div>

                <p

                  className="

                    text-xs

                    font-semibold

                    uppercase

                    tracking-[0.18em]

                    text-blue-700

                    dark:text-blue-400

                  "

                >

                  {category.label}

                </p>



                <p

                  className="

                    mt-1

                    text-sm

                    text-slate-500

                    dark:text-slate-400

                  "

                >

                  Set {subjectiveSet.set_number}

                </p>

              </div>

            </div>



            {/* -------------------------------------------

             * Title

             * ------------------------------------------- */}



            <h1

              className="

                mt-6

                max-w-3xl

                text-3xl

                font-bold

                tracking-tight

                text-blue-900

                dark:text-blue-400

                sm:text-4xl

              "

            >

              {subjectiveSet.title}

            </h1>



            {subjectiveSet.description && (

              <p

                className="

                  mt-4

                  max-w-3xl

                  text-lg

                  leading-8

                  text-slate-600

                  dark:text-slate-300

                "

              >

                {subjectiveSet.description}

              </p>

            )}



            {/* -------------------------------------------

             * Access

             * ------------------------------------------- */}



            <div className="mt-6">

              {isPremium ? (

                <div className="flex flex-wrap items-center gap-2">

                  <span

                    className="

                      inline-flex

                      items-center

                      rounded-full

                      bg-amber-50

                      px-4

                      py-2

                      text-sm

                      font-semibold

                      text-amber-700

                      dark:bg-amber-500/10

                      dark:text-amber-400

                    "

                  >

                    Premium Practice

                  </span>



                  {!canAccessSet && (

                    <span

                      className="

                        inline-flex

                        items-center

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

                      Locked

                    </span>

                  )}

                </div>

              ) : (

                <span

                  className="

                    inline-flex

                    items-center

                    rounded-full

                    bg-emerald-50

                    px-4

                    py-2

                    text-sm

                    font-semibold

                    text-emerald-700

                    dark:bg-emerald-500/10

                    dark:text-emerald-400

                  "

                >

                  Free Practice

                </span>

              )}

            </div>

          </div>

        </section>



        {/* =================================================

         * Set Summary

         * ================================================= */}



        <section>

          <div

            className="

              grid

              gap-4

              sm:grid-cols-2

            "

          >

            <SummaryCard

              label="Questions"

              value={

                isPremium && !canAccessSet

                  ? "—"

                  : questionCount

              }

            />



            <SummaryCard

              label="Total Marks"

              value={

                isPremium && !canAccessSet

                  ? "—"

                  : totalMarks

              }

            />

          </div>

        </section>



        {/* =================================================

         * What You Will Practise

         * ================================================= */}



        <section

          className="

            rounded-3xl

            border

            border-slate-200

            bg-white

            p-7

            shadow-sm

            dark:border-slate-800

            dark:bg-slate-900

            dark:shadow-none

            sm:p-8

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

            What you will practise

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

            {category.label}

          </h2>



          <p

            className="

              mt-3

              max-w-3xl

              text-base

              leading-7

              text-slate-600

              dark:text-slate-400

            "

          >

            {category.description}

          </p>



          <div

            className="

              mt-6

              flex

              flex-wrap

              gap-2

            "

          >

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

              Written Solutions

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

              Mathematical Reasoning

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

              Guided Evaluation

            </span>

          </div>

        </section>



        {/* =================================================

         * Premium Lock Notice

         * ================================================= */}



        {isPremium && !canAccessSet && (

          <section

            className="

              rounded-3xl

              border

              border-amber-200

              bg-amber-50

              p-7

              dark:border-amber-900

              dark:bg-amber-950/20

              sm:p-8

            "

          >

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

              <div

                className="

                  flex

                  h-12

                  w-12

                  shrink-0

                  items-center

                  justify-center

                  rounded-2xl

                  bg-amber-100

                  text-xl

                  text-amber-700

                  dark:bg-amber-500/10

                  dark:text-amber-400

                "

              >

                🔒

              </div>



              <div>

                <p

                  className="

                    text-sm

                    font-semibold

                    uppercase

                    tracking-[0.18em]

                    text-amber-700

                    dark:text-amber-400

                  "

                >

                  Premium Practice

                </p>



                <h2

                  className="

                    mt-2

                    text-2xl

                    font-bold

                    text-amber-900

                    dark:text-amber-300

                  "

                >

                  This practice set is currently locked.

                </h2>



                <p

                  className="

                    mt-3

                    max-w-2xl

                    text-sm

                    leading-7

                    text-amber-800

                    dark:text-amber-200

                  "

                >

                  This chapter contains premium subjective

                  practice. Unlock access to begin solving

                  and submitting your written solutions.

                </p>

              </div>

            </div>

          </section>

        )}



        {/* =================================================

         * Practice / Review Action

         * ================================================= */}



        <section

          className="

            rounded-3xl

            border

            border-blue-100

            bg-blue-50/70

            p-7

            dark:border-blue-900

            dark:bg-blue-950/20

            sm:p-8

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

            <div>

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

                {primaryAction === "LOCKED"

                  ? "Premium Access"

                  : primaryAction === "REVIEW"

                    ? "Practice completed"

                    : primaryAction === "RETRY"

                      ? "One more attempt"

                      : primaryAction === "CONTINUE"

                        ? "Practice in progress"

                        : "Ready?"}

              </p>



              <h2

                className="

                  mt-2

                  text-2xl

                  font-bold

                  text-blue-900

                  dark:text-blue-300

                "

              >

                {primaryAction === "LOCKED"

                  ? "Unlock this practice set to begin."

                  : primaryAction === "REVIEW"

                    ? "Your submitted work is ready to review."

                    : primaryAction === "RETRY"

                      ? "Continue your practice with another attempt."

                      : primaryAction === "CONTINUE"

                        ? "Continue where you left off."

                        : "Begin your written practice."}

              </h2>



              <p

                className="

                  mt-2

                  max-w-xl

                  text-sm

                  leading-6

                  text-slate-600

                  dark:text-slate-300

                "

              >

                {primaryAction === "LOCKED"

                  ? "Purchase access to this chapter before starting this premium practice set."

                  : primaryAction === "REVIEW"

                    ? "You can revisit your submitted answers and evaluation."

                    : primaryAction === "RETRY"

                      ? "Use this attempt to rethink, improve, and submit your solutions again."

                      : primaryAction === "CONTINUE"

                        ? "Your current attempt is still open."

                        : "Take your time. Read each question carefully and express your reasoning clearly."}

              </p>

            </div>



            {/* -------------------------------------------

             * Locked Premium CTA

             * ------------------------------------------- */}



            {primaryAction === "LOCKED" ? (

              <Link

                href="/learning"

                className="

                  inline-flex

                  min-w-52

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

                  transition

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

                {primaryLabel}



                <span className="ml-2">

                  →

                </span>

              </Link>

            ) : (primaryAction === "CONTINUE" ||

                primaryAction === "REVIEW") &&

              primaryAttemptId ? (

              /* -----------------------------------------

               * Continue / Review

               * ----------------------------------------- */



              <Link

                href={`/learning/subjective/attempt/${encodeURIComponent(

                  primaryAttemptId

                )}`}

                className="

                  inline-flex

                  min-w-44

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

                  transition

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

                {primaryLabel}



                <span className="ml-2">

                  →

                </span>

              </Link>

            ) : (

              /* -----------------------------------------

               * Start / Retry

               * ----------------------------------------- */



              <form

                action={async () => {

                  "use server";



                  await startSubjectiveAttempt(

                    subjectiveSet.id

                  );

                }}

              >

                <button

                  type="submit"

                  className="

                    inline-flex

                    min-w-44

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

                    transition

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

                  {primaryLabel}



                  <span className="ml-2">

                    →

                  </span>

                </button>

              </form>

            )}

          </div>



          {/* =================================================

           * Premium Attempt 1 Review

           * ================================================= */}



          {isPremiumRetryAvailable &&

            attemptOne?.id && (

              <div

                className="

                  mt-6

                  border-t

                  border-blue-100

                  pt-5

                  dark:border-blue-900/60

                "

              >

                <Link

                  href={`/learning/subjective/attempt/${encodeURIComponent(

                    attemptOne.id

                  )}`}

                  className="

                    inline-flex

                    items-center

                    gap-2

                    text-sm

                    font-semibold

                    text-blue-700

                    transition

                    hover:text-blue-900

                    hover:underline

                    dark:text-blue-400

                    dark:hover:text-blue-300

                  "

                >

                  Review Attempt 1

                  <span>→</span>

                </Link>

              </div>

            )}

        </section>



        {/* =================================================

         * Quiet Note

         * ================================================= */}



        <section className="pb-4 text-center">

          <p

            className="

              mx-auto

              max-w-2xl

              text-sm

              leading-7

              text-slate-500

              dark:text-slate-400

            "

          >

            Do not rush towards the answer.

            <br />

            Give your thinking enough space to become clear.

          </p>

        </section>



      </div>

    </main>

  );

}



/* =========================================================

 * Summary Card

 * ========================================================= */



function SummaryCard({

  label,

  value,

}: {

  label: string;

  value: string | number;

}) {

  return (

    <div

      className="

        rounded-2xl

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

      <p

        className="

          text-sm

          text-slate-500

          dark:text-slate-400

        "

      >

        {label}

      </p>



      <p

        className="

          mt-2

          text-3xl

          font-bold

          text-blue-900

          dark:text-blue-400

        "

      >

        {value}

      </p>

    </div>

  );

}



/* =========================================================

 * Class Slug Helper

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



  const map: Record<string, string> = {

    IX: "class-9",

    X: "class-10",

    XI: "class-11",

    XII: "class-12",

  };



  return map[value] ?? null;

}