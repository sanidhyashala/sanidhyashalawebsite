import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getStudentProfile } from "@/lib/learning/student-profile";
import { getLearningCurriculum } from "@/lib/learning/curriculum";
import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

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
     * Supabase may return this relation as either:
     *
     * 1. an array
     * 2. a single object
     *
     * We normalize it before using it.
     */
    resources?: LearningResource | LearningResource[] | null;
  }[] | null;
};

/* =========================================================
 * Category Configuration
 * ========================================================= */

const CATEGORY_META = {
  UNDERSTAND_APPLY: {
    label: "Understand & Apply",
    shortLabel: "Understand & Apply",
    description:
      "Build clarity, strengthen concepts, and apply what you understand through written practice.",
    icon: "◫",
  },

  THINK_SOLVE: {
    label: "Think & Solve",
    shortLabel: "Think & Solve",
    description:
      "Go beyond routine practice through reasoning, connections, and thoughtful problem solving.",
    icon: "✦",
  },

  CASE_BASED: {
    label: "Case Based",
    shortLabel: "Case Based",
    description:
      "Work with contextual and competency-based questions that connect mathematics with situations.",
    icon: "▣",
  },
} as const;

/* =========================================================
 * Page Props
 * ========================================================= */

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

/* =========================================================
 * Page
 * ========================================================= */

export default async function SubjectiveResourcePage({
  params,
}: PageProps) {
  /* =====================================================
   * Authentication Gate
   * ===================================================== */

  const { isAuthenticated } = await auth();

  const { resourceId } = await params;

  if (!isAuthenticated) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(
        `/learning/subjective/chapter-wise/${resourceId}`
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
              Your student profile is complete, but no
              learning class has been assigned to it yet.
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
   * Validate Resource Against Student Curriculum
   *
   * We do not trust the resourceId alone.
   *
   * The requested resource must:
   *
   * 1. Belong to the student's published curriculum.
   * 2. Be mapped to an active chapter.
   * 3. Be a SUBJECTIVE resource.
   * 4. Be PUBLISHED.
   * ===================================================== */

  const chapters =
    (await getLearningCurriculum(
      classSlug
    )) as LearningChapter[];

  let matchedChapter:
    | LearningChapter
    | null = null;

  let matchedResource:
    | LearningResource
    | null = null;

  for (const chapter of chapters) {
    const mappings =
      chapter.resource_curriculum_nodes ?? [];

    for (const mapping of mappings) {
      /*
       * ===================================================
       * IMPORTANT:
       *
       * Supabase can return `resources` as either:
       *
       *     { ...resource }
       *
       * or
       *
       *     [{ ...resource }]
       *
       * Normalize both shapes into an array.
       * ===================================================
       */

      const resources = Array.isArray(
        mapping.resources
      )
        ? mapping.resources
        : mapping.resources
          ? [mapping.resources]
          : [];

      const resource = resources.find(
        (item) =>
          item.id === resourceId &&
          item.resource_type ===
            "SUBJECTIVE" &&
          item.status === "PUBLISHED"
      );

      if (resource) {
        matchedChapter = chapter;
        matchedResource = resource;
        break;
      }
    }

    if (matchedResource) {
      break;
    }
  }

  if (!matchedChapter || !matchedResource) {
    notFound();
  }

  /* =====================================================
   * Load Published Subjective Sets
   * ===================================================== */

  const supabase =
    await createLearningSupabaseClient();

  const {
    data: sets,
    error: setsError,
  } = await supabase
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
    .eq(
      "resource_id",
      resourceId
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .order(
      "display_order",
      {
        ascending: true,
        nullsFirst: false,
      }
    )
    .order(
      "set_number",
      {
        ascending: true,
      }
    );

  if (setsError) {
    throw new Error(
      `Failed to load Subjective sets: ${setsError.message}`
    );
  }

  const publishedSets =
    (sets ?? []) as SubjectiveSet[];

  /* =====================================================
   * Group Sets by Category
   * ===================================================== */

  const categoryOrder:
    SubjectiveSet["category"][] =
    [
      "UNDERSTAND_APPLY",
      "THINK_SOLVE",
      "CASE_BASED",
    ];

  const groupedSets =
    categoryOrder.map((category) => ({
      category,
      meta: CATEGORY_META[category],
      sets: publishedSets
        .filter(
          (set) =>
            set.category === category
        )
        .sort(
          (a, b) =>
            (a.display_order ?? 0) -
              (b.display_order ?? 0) ||
            a.set_number -
              b.set_number
        ),
    }));

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
              h-72
              w-72
              rounded-full
              bg-blue-50
              blur-3xl
              dark:bg-blue-950/30
            "
          />

          <div className="relative">
            <Link
              href="/learning/subjective/chapter-wise"
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
              All Chapters
            </Link>

            <div className="mt-7 flex items-start gap-4">
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-xl
                  font-bold
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                {String(
                  matchedChapter.sequence_order
                ).padStart(2, "0")}
              </div>

              <div className="min-w-0">
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
                  Chapter{" "}
                  {matchedChapter.sequence_order}
                </p>

                <h1
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    tracking-tight
                    text-blue-900
                    dark:text-blue-400
                    sm:text-4xl
                  "
                >
                  {matchedChapter.display_name}
                </h1>
              </div>
            </div>

            <p
              className="
                mt-6
                max-w-3xl
                text-lg
                leading-8
                text-slate-600
                dark:text-slate-300
              "
            >
              {matchedResource.title}
            </p>

            <p
              className="
                mt-3
                max-w-3xl
                text-base
                leading-7
                text-slate-500
                dark:text-slate-400
              "
            >
              Choose a practice path that matches where
              you are in your learning journey.
            </p>
          </div>
        </section>

        {/* =================================================
         * Practice Paths
         * ================================================= */}

        <section>
          <div className="mb-7">
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
              The Subjective Journey
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
              Choose how you want to practise.
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
              Start with understanding, move towards
              deeper thinking, and challenge yourself with
              contextual problems.
            </p>
          </div>

          {publishedSets.length === 0 ? (
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
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
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
                Practice is being prepared
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
                Subjective practice sets for this chapter
                will appear here once they are published.
              </p>

              <Link
                href="/learning/subjective/chapter-wise"
                className="
                  mt-6
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:border-blue-300
                  hover:text-blue-700
                  dark:border-slate-700
                  dark:text-slate-300
                  dark:hover:border-blue-700
                  dark:hover:text-blue-400
                "
              >
                Explore Other Chapters
              </Link>
            </section>
          ) : (
            <div className="space-y-10">
              {groupedSets.map(
                ({
                  category,
                  meta,
                  sets,
                }) => {
                  if (sets.length === 0) {
                    return null;
                  }

                  return (
                    <section
                      key={category}
                    >
                      {/* Category heading */}

                      <div
                        className="
                          mb-5
                          flex
                          items-start
                          gap-4
                        "
                      >
                        <div
                          className="
                            flex
                            h-11
                            w-11
                            shrink-0
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
                          {meta.icon}
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
                            Practice Path
                          </p>

                          <h3
                            className="
                              mt-1
                              text-xl
                              font-bold
                              text-slate-900
                              dark:text-slate-100
                              sm:text-2xl
                            "
                          >
                            {meta.label}
                          </h3>

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
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Sets */}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {sets.map((set) => {
                          const isPremium =
                            set.access_type ===
                            "PREMIUM";

                          return (
                            <Link
                              key={set.id}
                              href={`/learning/subjective/sets/${set.id}`}
                              className="
                                group
                                rounded-3xl
                                border
                                border-slate-200
                                bg-white
                                p-6
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-blue-300
                                hover:shadow-md
                                dark:border-slate-800
                                dark:bg-slate-900
                                dark:shadow-none
                                dark:hover:border-blue-700
                              "
                            >
                              <div
                                className="
                                  flex
                                  items-start
                                  justify-between
                                  gap-4
                                "
                              >
                                <div
                                  className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-blue-50
                                    text-sm
                                    font-bold
                                    text-blue-700
                                    dark:bg-blue-500/10
                                    dark:text-blue-400
                                  "
                                >
                                  {set.set_number}
                                </div>

                                {isPremium ? (
                                  <span
                                    className="
                                      rounded-full
                                      bg-amber-50
                                      px-3
                                      py-1
                                      text-xs
                                      font-semibold
                                      text-amber-700
                                      dark:bg-amber-500/10
                                      dark:text-amber-400
                                    "
                                  >
                                    Premium
                                  </span>
                                ) : (
                                  <span
                                    className="
                                      rounded-full
                                      bg-emerald-50
                                      px-3
                                      py-1
                                      text-xs
                                      font-semibold
                                      text-emerald-700
                                      dark:bg-emerald-500/10
                                      dark:text-emerald-400
                                    "
                                  >
                                    Free
                                  </span>
                                )}
                              </div>

                              <h4
                                className="
                                  mt-5
                                  text-xl
                                  font-bold
                                  text-slate-900
                                  transition-colors
                                  group-hover:text-blue-700
                                  dark:text-slate-100
                                  dark:group-hover:text-blue-400
                                "
                              >
                                {set.title}
                              </h4>

                              {set.description && (
                                <p
                                  className="
                                    mt-3
                                    text-sm
                                    leading-6
                                    text-slate-500
                                    dark:text-slate-400
                                  "
                                >
                                  {set.description}
                                </p>
                              )}

                              <div
                                className="
                                  mt-6
                                  flex
                                  items-center
                                  justify-between
                                  border-t
                                  border-slate-100
                                  pt-5
                                  dark:border-slate-800
                                "
                              >
                                <span
                                  className="
                                    text-sm
                                    font-semibold
                                    text-blue-700
                                    dark:text-blue-400
                                  "
                                >
                                  Start Practice
                                </span>

                                <span
                                  className="
                                    text-blue-700
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-1
                                    dark:text-blue-400
                                  "
                                >
                                  →
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =================================================
         * Closing Note
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
            Remember
          </p>

          <p
            className="
              mt-3
              max-w-3xl
              text-lg
              leading-8
              text-blue-900
              dark:text-blue-200
            "
          >
            A written solution is not just an answer.
            It is a window into how you think.
          </p>
        </section>
      </div>
    </main>
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