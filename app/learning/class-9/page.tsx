import Link from "next/link";

import {
  getLearningCurriculum,
  getLearningSubjects,
} from "@/lib/learning/curriculum";

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
  CASE_BASED: {
    label: "📖 Case-Based Questions",
    description:
      "Competency-based and case-study questions for practice.",
  },
} as const;

type PageProps = {
  searchParams?: Promise<{
    subject?: string | string[];
    branch?: string | string[];
  }>;
};

export default async function Class9Page({
  searchParams,
}: PageProps) {
  const classSlug = "class-9";

  const searchParamsValue = searchParams
    ? await searchParams
    : {};

  const subjectParam = Array.isArray(searchParamsValue.subject)
    ? searchParamsValue.subject[0] ?? ""
    : searchParamsValue.subject ?? "";

  const branchParam = Array.isArray(searchParamsValue.branch)
    ? searchParamsValue.branch[0] ?? ""
    : searchParamsValue.branch ?? "";

  const normalizedSubject =
    subjectParam.trim().toLowerCase();

  const normalizedBranch =
    branchParam.trim().toLowerCase();

  const { subjects } =
    await getLearningSubjects(classSlug);

  const mathematicsSubject =
    subjects.find(
      (subject) =>
        subject.display_name.trim().toLowerCase() ===
        "mathematics",
    ) ?? null;

  const scienceSubject =
    subjects.find(
      (subject) =>
        subject.display_name.trim().toLowerCase() ===
        "science",
    ) ?? null;

  const selectedSubject =
    subjects.find(
      (subject) =>
        subject.display_name.trim().toLowerCase() ===
        normalizedSubject,
    ) ?? null;

  const isMathematics =
    normalizedSubject === "mathematics";

  const isScience =
    normalizedSubject === "science";

  const scienceBranches =
    scienceSubject
      ? await getLearningCurriculum(classSlug, {
          parentNodeId: scienceSubject.id,
        })
      : [];

  const selectedBranch =
    scienceBranches.find(
      (branch) =>
        branch.display_name.trim().toLowerCase() ===
        normalizedBranch,
    ) ?? null;

  const selectedScienceBranch =
    normalizedSubject === "physics" ||
    normalizedSubject === "chemistry" ||
    normalizedSubject === "biology"
      ? scienceBranches.find(
          (branch) =>
            branch.display_name.trim().toLowerCase() ===
            normalizedSubject,
        ) ?? null
      : selectedBranch;

  const isScienceBranch =
    Boolean(selectedScienceBranch);

  const contentSubject =
    isMathematics
      ? mathematicsSubject
      : isScienceBranch
        ? scienceSubject
        : selectedSubject;

  const chapters =
    contentSubject && !isScience && !isScienceBranch
      ? await getLearningCurriculum(classSlug, {
          parentNodeId: contentSubject.id,
          includeLockedNotes: true,
        })
      : isScienceBranch
        ? await getLearningCurriculum(classSlug, {
            parentNodeId: selectedScienceBranch!.id,
            includeLockedNotes: true,
          })
        : [];

  const subjectDisplayName =
    isScienceBranch
      ? selectedScienceBranch?.display_name ??
        normalizedSubject
      : contentSubject?.display_name ??
        "Learning";

  const subjectQuery =
    encodeURIComponent(
      subjectDisplayName
        .trim()
        .toLowerCase(),
    );

  const isContentHub =
    isMathematics || isScienceBranch;

  return (
    <main className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
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
              Class IX · Learning Space
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
              {isContentHub
                ? `${subjectDisplayName} Learning`
                : "Welcome to your learning space."}
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
              {isContentHub
                ? `Explore ${subjectDisplayName} through notes, practice, and thoughtful written work.`
                : "Learning is not only about finding the right answer. It is about understanding ideas clearly and gradually building the confidence to think on your own."}
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
            Subject Selection
        ===================================================== */}

        {!isContentHub && !isScience && (
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
                Choose a subject
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
                Where would you like to begin?
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
                Choose a subject first. Its learning resources
                will remain completely separate from the others.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {subjects.map((subject) => {
                const key =
                  subject.display_name
                    .trim()
                    .toLowerCase();

                const isSubjectScience =
                  key === "science";

                return (
                  <Link
                    key={subject.id}
                    href={`/learning/class-9?subject=${encodeURIComponent(key)}`}
                    className="
                      group
                      flex
                      min-h-[220px]
                      flex-col
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
                        font-bold
                        text-blue-700
                        dark:bg-blue-950
                        dark:text-blue-400
                      "
                    >
                      {isSubjectScience ? "⚛" : "Σ"}
                    </div>

                    <p
                      className="
                        mt-6
                        text-xs
                        font-semibold
                        uppercase
                        tracking-widest
                        text-blue-700
                        dark:text-blue-400
                      "
                    >
                      Subject
                    </p>

                    <h3
                      className="
                        mt-2
                        text-2xl
                        font-bold
                        text-slate-900
                        dark:text-slate-100
                      "
                    >
                      {subject.display_name}
                    </h3>

                    <p
                      className="
                        mt-3
                        flex-1
                        text-sm
                        leading-6
                        text-slate-600
                        dark:text-slate-400
                      "
                    >
                      {isSubjectScience
                        ? "Explore Physics, Chemistry and Biology through the same learning structure."
                        : "Explore chapter-wise learning resources designed for conceptual clarity and practice."}
                    </p>

                    <span
                      className="
                        mt-6
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
                      Open {subject.display_name}
                      <span className="ml-2">→</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================
            Science Branch Selection
        ===================================================== */}

        {isScience && (
          <section className="mt-12">
            <div className="mb-6">
              <Link
                href="/learning/class-9"
                className="
                  text-sm
                  font-semibold
                  text-blue-700
                  hover:underline
                  dark:text-blue-400
                "
              >
                ← All Subjects
              </Link>

              <p
                className="
                  mt-6
                  text-sm
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Science
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
                Choose a science stream
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
                Choose Physics, Chemistry or Biology to continue.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {scienceBranches.map((branch) => (
                <Link
                  key={branch.id}
                  href={`/learning/class-9?subject=${encodeURIComponent(
                    branch.display_name
                      .trim()
                      .toLowerCase(),
                  )}`}
                  className="
                    group
                    flex
                    min-h-[220px]
                    flex-col
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
                      text-xl
                      font-bold
                      text-blue-700
                      dark:bg-blue-950
                      dark:text-blue-400
                    "
                  >
                    {branch.display_name
                      .trim()
                      .charAt(0)}
                  </div>

                  <p
                    className="
                      mt-6
                      text-xs
                      font-semibold
                      uppercase
                      tracking-widest
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Science
                  </p>

                  <h3
                    className="
                      mt-2
                      text-2xl
                      font-bold
                      text-slate-900
                      dark:text-slate-100
                    "
                  >
                    {branch.display_name}
                  </h3>

                  <p
                    className="
                      mt-3
                      flex-1
                      text-sm
                      leading-6
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    Explore {branch.display_name} chapter by
                    chapter.
                  </p>

                  <span
                    className="
                      mt-6
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
                    Open {branch.display_name}
                    <span className="ml-2">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            Content Type Hub
        ===================================================== */}

        {isContentHub && (
          <>
            <section className="mt-12">
              <div className="mb-6">
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  <Link
                    href="/learning/class-9"
                    className="
                      transition
                      hover:text-blue-700
                      dark:hover:text-blue-400
                    "
                  >
                    Class IX
                  </Link>

                  <span>/</span>

                  <Link
                    href="/learning/class-9"
                    className="
                      transition
                      hover:text-blue-700
                      dark:hover:text-blue-400
                    "
                  >
                    Subjects
                  </Link>

                  <span>/</span>

                  <span>{subjectDisplayName}</span>
                </div>

                <p
                  className="
                    mt-6
                    text-sm
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-blue-700
                    dark:text-blue-400
                  "
                >
                  {subjectDisplayName}
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
                  How would you like to learn?
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
                  Choose a learning mode first. Your
                  {` ${subjectDisplayName} `}
                  content stays within its own subject space.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {/* MCQ */}
                <Link
                  href={
                    isMathematics
                      ? "/learning/class-9/mcq"
                      : `/learning/class-9/mcq?subject=${subjectQuery}`
                  }
                  className="
                    group
                    flex
                    h-full
                    flex-col
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

                  <p
                    className="
                      mt-6
                      text-xs
                      font-semibold
                      uppercase
                      tracking-widest
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Practice
                  </p>

                  <h3
                    className="
                      mt-2
                      text-2xl
                      font-bold
                      text-slate-900
                      dark:text-slate-100
                    "
                  >
                    MCQ Practice
                  </h3>

                  <p
                    className="
                      mt-3
                      flex-1
                      text-sm
                      leading-6
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    Practice chapter-wise multiple choice
                    questions and check your understanding.
                  </p>

                  <span
                    className="
                      mt-6
                      text-sm
                      font-semibold
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Explore MCQs →
                  </span>
                </Link>

                {/* Notes */}
                <Link
                  href={
                    isMathematics
                      ? "/learning/class-9/notes"
                      : `/learning/class-9/notes?subject=${subjectQuery}`
                  }
                  className="
                    group
                    flex
                    h-full
                    flex-col
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

                  <p
                    className="
                      mt-6
                      text-xs
                      font-semibold
                      uppercase
                      tracking-widest
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Understand
                  </p>

                  <h3
                    className="
                      mt-2
                      text-2xl
                      font-bold
                      text-slate-900
                      dark:text-slate-100
                    "
                  >
                    Notes
                  </h3>

                  <p
                    className="
                      mt-3
                      flex-1
                      text-sm
                      leading-6
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    Build conceptual clarity through
                    chapter-wise notes and thoughtful revision.
                  </p>

                  <span
                    className="
                      mt-6
                      text-sm
                      font-semibold
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Explore Notes →
                  </span>
                </Link>

                {/* Subjective */}
                <Link
                  href="/learning/subjective"
                  className="
                    group
                    flex
                    h-full
                    flex-col
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
                    ✎
                  </div>

                  <p
                    className="
                      mt-6
                      text-xs
                      font-semibold
                      uppercase
                      tracking-widest
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Think & Write
                  </p>

                  <h3
                    className="
                      mt-2
                      text-2xl
                      font-bold
                      text-slate-900
                      dark:text-slate-100
                    "
                  >
                    Subjective Questions
                  </h3>

                  <p
                    className="
                      mt-3
                      flex-1
                      text-sm
                      leading-6
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    Express your mathematical or scientific
                    thinking through written practice.
                  </p>

                  <span
                    className="
                      mt-6
                      text-sm
                      font-semibold
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Explore Subjective →
                  </span>
                </Link>
              </div>
            </section>

            {/* =================================================
                Chapter-wise Learning
            ================================================= */}

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
                  {subjectDisplayName} chapters
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
                  Choose a chapter and continue learning
                  through the resources available for it.
                </p>
              </div>

              <div className="space-y-6">
                {chapters.map((chapter) => {
                  const resources =
                    chapter.resource_curriculum_nodes?.flatMap(
                      (mapping) =>
                        mapping.resources ?? [],
                    ) ?? [];

                  const publishedResources =
                    resources
                      .filter(
                        (resource) =>
                          resource.status === "PUBLISHED",
                      )
                      .sort(
                        (a, b) =>
                          (a.display_order ?? 0) -
                          (b.display_order ?? 0),
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

                      {publishedResources.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {publishedResources.map(
                            (resource) => {
                              const meta =
                                resourceMeta[
                                  resource.resource_type as keyof typeof resourceMeta
                                ];

                              if (!meta) {
                                return null;
                              }

                              const href =
                                resource.resource_type ===
                                "MCQ"
                                  ? `/learning/resources/${resource.id}`
                                  : resource.resource_type ===
                                      "NOTE"
                                    ? `/learning/resources/${resource.id}`
                                    : null;

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
                                      dark:text-blue-400
                                    "
                                  >
                                    Explore →
                                  </p>
                                </Link>
                              );
                            },
                          )}
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
          </>
        )}

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