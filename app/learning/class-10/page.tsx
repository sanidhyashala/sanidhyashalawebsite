import Link from "next/link";

import { getLearningCurriculum } from "@/lib/learning/curriculum";
import { getLearningResourceHref } from "@/lib/learning/resource-routes";

const resourceMeta = {
  NOTE: {
    label: "📘 Notes",
    description:
      "Chapter-wise notes for conceptual understanding and revision.",
  },

  MCQ: {
    label: "📝 MCQ Practice",
    description:
      "Multiple choice questions for practice and self-assessment.",
  },

  SUBJECTIVE: {
    label: "✍️ Subjective Questions",
    description:
      "Short answer and long answer questions for practice.",
  },

  CASE_BASED: {
    label: "📖 Case-Based Questions",
    description:
      "Competency-based and case-study questions for practice.",
  },

  PYQ: {
    label: "📂 Previous Year Questions",
    description:
      "Chapter-wise and topic-wise previous year questions.",
  },

  MOCK_TEST: {
    label: "🧪 Mock Test",
    description:
      "Practice tests designed for self-assessment and exam preparation.",
  },
} as const;

export default async function Class10Page() {
  const classSlug = "class-10";

  const chapters = await getLearningCurriculum(classSlug);

  return (
    <main className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">

        {/* =====================================================
            Welcome
        ===================================================== */}

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
          {/* Subtle background accent */}

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
              Class X · Mathematics · 2026–27
            </p>

            <h1
              className="
                mt-4
                text-4xl
                font-bold
                tracking-tight
                text-blue-900
                dark:text-blue-400
                sm:text-5xl
              "
            >
              Welcome to your learning space.
            </h1>

            <p
              className="
                mt-5
                max-w-2xl
                text-lg
                leading-8
                text-slate-600
                dark:text-slate-300
              "
            >
              Mathematics is not only about finding the right answer.
              It is about learning to see a problem clearly, understand
              why something works, and gradually build the confidence
              to think on your own.
            </p>

            <p
              className="
                mt-4
                max-w-2xl
                text-base
                leading-7
                text-slate-500
                dark:text-slate-400
              "
            >
              Take your time. Understand deeply. Practice honestly.
              Let mastery grow from clarity.
            </p>
          </div>
        </section>

        {/* =====================================================
            Learning Choices
        ===================================================== */}

        <section className="mt-12">
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
              Begin where you need
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
              What would you like to explore?
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
              Understand a concept, or test what you have understood.
              The choice is yours.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* =================================================
                MCQ Practice
            ================================================= */}

            <Link
              href="/learning/class-10/mcq"
              className="
                group
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-7
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-blue-300
                hover:shadow-lg
                dark:border-slate-800
                dark:bg-slate-900
                dark:shadow-none
                dark:hover:border-blue-700
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-2xl
                  dark:bg-blue-950
                "
              >
                🧠
              </div>

              <h3
                className="
                  mt-6
                  text-2xl
                  font-bold
                  text-blue-900
                  dark:text-blue-400
                "
              >
                MCQ Practice
              </h3>

              <p
                className="
                  mt-3
                  max-w-md
                  text-base
                  leading-7
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Practice chapter-wise multiple choice questions,
                check your understanding, and discover where you
                need more practice.
              </p>

              <div
                className="
                  mt-7
                  inline-flex
                  items-center
                  text-sm
                  font-semibold
                  text-blue-700
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                  dark:text-blue-400
                "
              >
                Explore MCQs
                <span className="ml-2">→</span>
              </div>
            </Link>

            {/* =================================================
                Notes
            ================================================= */}

            <Link
              href="/learning/class-10/notes"
              className="
                group
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-7
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-blue-300
                hover:shadow-lg
                dark:border-slate-800
                dark:bg-slate-900
                dark:shadow-none
                dark:hover:border-blue-700
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-2xl
                  dark:bg-blue-950
                "
              >
                📘
              </div>

              <h3
                className="
                  mt-6
                  text-2xl
                  font-bold
                  text-blue-900
                  dark:text-blue-400
                "
              >
                Notes
              </h3>

              <p
                className="
                  mt-3
                  max-w-md
                  text-base
                  leading-7
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Explore chapter-wise notes created to build
                conceptual clarity, strengthen understanding,
                and support thoughtful revision.
              </p>

              <div
                className="
                  mt-7
                  inline-flex
                  items-center
                  text-sm
                  font-semibold
                  text-blue-700
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                  dark:text-blue-400
                "
              >
                Explore Notes
                <span className="ml-2">→</span>
              </div>
            </Link>

          </div>
        </section>

        {/* =====================================================
            Chapter-wise Learning
        ===================================================== */}

        <section className="mt-16">
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
              Choose a chapter and continue learning through the
              resources available for it.
            </p>
          </div>

          <div className="space-y-6">
            {chapters.map((chapter) => {
              const resources =
                chapter.resource_curriculum_nodes?.flatMap(
                  (mapping) => mapping.resources ?? []
                ) ?? [];

              const publishedResources = resources
                .filter(
                  (resource) =>
                    resource.status === "PUBLISHED"
                )
                .sort(
                  (a, b) =>
                    (a.display_order ?? 0) -
                    (b.display_order ?? 0)
                );

              return (
                <section
                  key={chapter.id}
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
                    sm:p-7
                  "
                >
                  {/* Chapter heading */}

                  <div className="mb-6 flex items-start gap-4">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-50
                        font-semibold
                        text-blue-700
                        dark:bg-blue-950
                        dark:text-blue-300
                      "
                    >
                      {chapter.sequence_order}
                    </div>

                    <div>
                      <h3
                        className="
                          text-xl
                          font-bold
                          text-blue-900
                          dark:text-blue-400
                          sm:text-2xl
                        "
                      >
                        {chapter.display_name}
                      </h3>

                      {chapter.description && (
                        <p
                          className="
                            mt-2
                            text-sm
                            leading-6
                            text-slate-600
                            dark:text-slate-400
                          "
                        >
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Chapter resources */}

                  {publishedResources.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {publishedResources.map((resource) => {
                        const meta =
                          resourceMeta[
                            resource.resource_type as keyof typeof resourceMeta
                          ];

                        if (!meta) {
                          return null;
                        }

                        const href =
                          resource.resource_type === "MCQ"
                            ? `/learning/resources/${resource.id}`
                            : getLearningResourceHref(
                                classSlug,
                                resource.resource_type,
                                resource.slug
                              );

                        if (!href) {
                          return null;
                        }

                        return (
                          <Link
                            key={resource.id}
                            href={href}
                            className="
                              group
                              rounded-2xl
                              border
                              border-slate-200
                              p-5
                              transition-all
                              duration-300
                              hover:-translate-y-0.5
                              hover:border-blue-300
                              hover:shadow-md
                              dark:border-slate-800
                              dark:hover:border-slate-700
                            "
                          >
                            <h4
                              className="
                                text-lg
                                font-semibold
                                text-blue-900
                                dark:text-blue-400
                              "
                            >
                              {meta.label}
                            </h4>

                            <p
                              className="
                                mt-2
                                text-sm
                                leading-6
                                text-slate-600
                                dark:text-slate-400
                              "
                            >
                              {meta.description}
                            </p>

                            <p
                              className="
                                mt-4
                                text-sm
                                font-semibold
                                text-blue-700
                                transition-colors
                                group-hover:text-blue-900
                                dark:text-blue-400
                                dark:group-hover:text-blue-300
                              "
                            >
                              Explore →
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-dashed
                        border-slate-200
                        px-5
                        py-6
                        text-sm
                        text-slate-500
                        dark:border-slate-800
                        dark:text-slate-400
                      "
                    >
                      Learning resources for this chapter
                      will appear here as they are published.
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            Quiet Closing
        ===================================================== */}

        <section className="mt-12 text-center">
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
            There is no need to rush.
            <br />
            Learn one idea well, and let the next one follow.
          </p>
        </section>

      </div>
    </main>
  );
}