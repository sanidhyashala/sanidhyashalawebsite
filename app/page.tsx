import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Compass, PenLine } from "lucide-react";

import NewsletterForm from "@/app/components/newsletter/NewsletterForm";
import { loadAllJournalArticles } from "@/app/lib/journal/loader/loadAllJournalArticles";

export default function Home() {
  const posts = Object.entries(loadAllJournalArticles());

  const latestArticles = posts.slice(0, 3).map(([slug, data]) => ({
    slug,
    title: data.meta.title,
    description: data.meta.description,
    readingTime: data.meta.readingTime,
    languages: data.meta.languages,
  }));

  const pillars = [
    {
      title: "Learning",
      description:
        "Learn with understanding through Notes, MCQs and Subjective Practice.",
      href: "/learning",
      icon: BookOpen,
    },
    {
      title: "Teaching",
      description:
        "Explore teaching as the work of making understanding possible.",
      href: "/teaching",
      icon: Brain,
    },
    {
      title: "Reflection",
      description:
        "Pause with questions that deserve more than a quick answer.",
      href: "/reflection",
      icon: Compass,
    },
    {
      title: "Journal",
      description:
        "Follow longer questions across mathematics, education, philosophy and life.",
      href: "/journal",
      icon: PenLine,
    },
  ];

  return (
    <main className="relative isolate overflow-hidden bg-white dark:bg-slate-950">

      {/* =========================================================
          GLOBAL MATHEMATICAL ATMOSPHERE
      ========================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* =====================================================
            MAIN MATHEMATICAL FIELD
        ====================================================== */}
        <svg
          viewBox="0 0 1400 2400"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          className="
            absolute
            left-1/2
            top-0
            h-full
            w-full
            min-w-[1000px]
            -translate-x-1/2
            text-blue-900/[0.20]
            dark:text-blue-300/[0.18]
          "
        >
          <g className="origin-center motion-safe:animate-[spin_140s_linear_infinite]">

            {/* =================================================
                CENTRAL CIRCULAR FIELD
            ================================================== */}

            <circle
              cx="700"
              cy="500"
              r="170"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            <circle
              cx="700"
              cy="500"
              r="300"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <circle
              cx="700"
              cy="500"
              r="470"
              stroke="currentColor"
              strokeWidth="1"
            />

            {/* =================================================
                COORDINATE AXES
            ================================================== */}

            <path
              d="M80 500H1320"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="5 14"
            />

            <path
              d="M700 0V1000"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="5 14"
            />

            {/* =================================================
                CURVED MATHEMATICAL PATHS
            ================================================== */}

            <path
              d="M150 760C390 170 1010 170 1250 760"
              stroke="currentColor"
              strokeWidth="1.6"
            />

            <path
              d="M150 240C390 830 1010 830 1250 240"
              stroke="currentColor"
              strokeWidth="1.6"
            />

            {/* =================================================
                DIAGONAL CONNECTIONS
            ================================================== */}

            <path
              d="M60 1180L1340 1840"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 18"
            />

            <path
              d="M1340 1180L60 1840"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 18"
            />

            {/* =================================================
                LOWER GEOMETRY
            ================================================== */}

            <circle
              cx="340"
              cy="1740"
              r="125"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <circle
              cx="1050"
              cy="1900"
              r="210"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M130 2050C390 1640 1010 1640 1270 2050"
              stroke="currentColor"
              strokeWidth="1.3"
            />

            {/* =================================================
                ADDITIONAL SUBTLE ARC
            ================================================== */}

            <path
              d="M40 1450C280 1250 520 1250 700 1450C880 1650 1120 1650 1360 1450"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 15"
            />

            {/* =================================================
                MATHEMATICAL POINTS
            ================================================== */}

            <circle
              cx="700"
              cy="500"
              r="6"
              fill="currentColor"
            />

            <circle
              cx="400"
              cy="500"
              r="4.5"
              fill="currentColor"
            />

            <circle
              cx="1000"
              cy="500"
              r="4.5"
              fill="currentColor"
            />

            <circle
              cx="700"
              cy="200"
              r="4.5"
              fill="currentColor"
            />

            <circle
              cx="700"
              cy="800"
              r="4.5"
              fill="currentColor"
            />

            <circle
              cx="340"
              cy="1740"
              r="4"
              fill="currentColor"
            />

            <circle
              cx="1050"
              cy="1900"
              r="4"
              fill="currentColor"
            />
          </g>
        </svg>

        {/* =====================================================
            SOFT MATHEMATICAL LIGHT
        ====================================================== */}

        <div
          className="
            absolute
            left-[2%]
            top-[7%]
            h-80
            w-80
            rounded-full
            bg-blue-300/30
            blur-3xl
            dark:bg-blue-500/20
          "
        />

        <div
          className="
            absolute
            right-[2%]
            top-[28%]
            h-96
            w-96
            rounded-full
            bg-blue-200/25
            blur-3xl
            dark:bg-blue-700/20
          "
        />

        <div
          className="
            absolute
            bottom-[10%]
            left-[15%]
            h-72
            w-72
            rounded-full
            bg-slate-300/30
            blur-3xl
            dark:bg-blue-900/20
          "
        />
      </div>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section
        className="
          relative
          z-10
          isolate
          overflow-hidden
          bg-slate-50/70
          px-6
          py-24
          backdrop-blur-[1px]
          dark:bg-slate-950/70
          md:py-32
        "
      >
        <div className="mx-auto max-w-5xl text-center">

          <p className="mb-5 text-sm font-medium uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            From Clarity to Mastery
          </p>

          <h1 className="mb-5 text-6xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-7xl lg:text-8xl">
            सान्निध्यशाला
          </h1>

          <p className="mb-5 text-xl font-medium text-slate-600 dark:text-slate-300 md:text-2xl">
            स्पष्टता से सिद्धि तक
          </p>

          <p className="mb-8 text-2xl text-slate-700 dark:text-slate-200 md:text-3xl">
            Learn. Teach. Reflect.
          </p>

          <p className="mx-auto mb-10 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400 md:text-xl">
            A space where learning, teaching, reflection and curiosity come
            together — with mathematics as one of the doors into a larger
            journey of understanding.
          </p>

          <div className="flex flex-wrap justify-center gap-4">

            <Link
              href="/learning"
              className="
                group
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-900
                px-6
                py-3.5
                font-medium
                text-white
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-blue-800
                hover:shadow-lg
                dark:bg-blue-400
                dark:text-slate-950
                dark:hover:bg-blue-300
              "
            >
              Begin Learning

              <ArrowRight
                className="
                  h-4
                  w-4
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              />
            </Link>

            <Link
              href="/about"
              className="
                inline-flex
                items-center
                rounded-xl
                border
                border-slate-300
                bg-white/90
                px-6
                py-3.5
                font-medium
                text-slate-700
                backdrop-blur-sm
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-blue-300
                hover:bg-white
                hover:text-blue-800
                hover:shadow-md
                dark:border-slate-700
                dark:bg-slate-900/85
                dark:text-slate-300
                dark:hover:border-blue-500
                dark:hover:text-blue-400
              "
            >
              Discover SanidhyaShala
            </Link>

          </div>
        </div>
      </section>

      {/* =========================================================
          FOUR PILLARS
      ========================================================= */}
      <section
        className="
          relative
          z-10
          bg-white/80
          px-6
          py-20
          backdrop-blur-[1px]
          dark:bg-slate-950/80
          md:py-24
        "
      >
        <div className="mx-auto max-w-6xl">

          <div className="mb-12 max-w-2xl">

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
              Four ways to enter
            </p>

            <h2 className="text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-5xl">
              Begin wherever your question takes you.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">
              SanidhyaShala does not ask every learner to follow the same path.
              You can come here to learn, to teach, to reflect, or simply to
              follow an idea that has stayed with you.
            </p>

          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <Link
                  key={pillar.href}
                  href={pillar.href}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white/95
                    p-7
                    shadow-sm
                    backdrop-blur-sm
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-blue-200
                    hover:shadow-lg
                    dark:border-slate-800
                    dark:bg-slate-900/95
                    dark:hover:border-blue-800
                    dark:hover:shadow-black/20
                  "
                >

                  <div
                    className="
                      mb-6
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-800
                      transition-all
                      duration-300
                      group-hover:scale-105
                      group-hover:bg-blue-100
                      dark:bg-blue-500/10
                      dark:text-blue-400
                      dark:group-hover:bg-blue-500/15
                    "
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mb-3 text-2xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-slate-100 dark:group-hover:text-blue-400">
                    {pillar.title}
                  </h3>

                  <p className="leading-7 text-slate-600 dark:text-slate-400">
                    {pillar.description}
                  </p>

                  <span
                    className="
                      mt-6
                      inline-flex
                      items-center
                      gap-1
                      text-sm
                      font-medium
                      text-blue-800
                      dark:text-blue-400
                    "
                  >
                    Explore

                    <ArrowRight
                      className="
                        h-4
                        w-4
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </span>

                </Link>
              );
            })}

          </div>
        </div>
      </section>

      {/* =========================================================
          WHAT IS SANIDHYASHALA
      ========================================================= */}
      <section
        className="
          relative
          z-10
          bg-slate-50/82
          px-6
          py-20
          backdrop-blur-[1px]
          dark:bg-slate-900/80
          md:py-24
        "
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

          <div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
              The idea
            </p>

            <h2 className="text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-5xl">
              What is SanidhyaShala?
            </h2>

          </div>

          <div className="text-lg leading-8 text-slate-700 dark:text-slate-300">

            <p>
              SanidhyaShala began with a simple but difficult question:

              <span className="font-medium text-slate-900 dark:text-slate-100">
                {" "}
                What does it actually mean to learn?
              </span>
            </p>

            <p className="mt-6">
              Education can give us lessons, notes, questions, answers and
              examinations. But learning can be something wider. It can mean
              understanding an idea deeply, noticing where our thinking is
              incomplete, connecting things that once seemed unrelated, and
              sometimes discovering a better question.
            </p>

            <p className="mt-6">
              That is the space SanidhyaShala is trying to create — a place
              where learning is accompanied by teaching, reflection and
              curiosity.
            </p>

          </div>
        </div>
      </section>

      {/* =========================================================
          LATEST JOURNAL
      ========================================================= */}
      <section
        className="
          relative
          z-10
          bg-white/84
          px-6
          py-20
          backdrop-blur-[1px]
          dark:bg-slate-950/84
          md:py-24
        "
      >
        <div className="mx-auto max-w-6xl">

          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                From the Journal
              </p>

              <h2 className="text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-5xl">
                Ideas worth staying with.
              </h2>

            </div>

            <Link
              href="/journal"
              className="
                group
                inline-flex
                items-center
                gap-2
                font-medium
                text-blue-800
                transition-colors
                hover:text-blue-600
                dark:text-blue-400
                dark:hover:text-blue-300
              "
            >
              Explore the Journal

              <ArrowRight
                className="
                  h-4
                  w-4
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              />
            </Link>

          </div>

          {latestArticles.length > 0 ? (

            <div className="grid gap-6 md:grid-cols-3">

              {latestArticles.map((article, index) => (

                <Link
                  key={article.slug}
                  href={`/journal/${article.slug}`}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white/95
                    p-7
                    shadow-sm
                    backdrop-blur-sm
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-blue-200
                    hover:shadow-lg
                    dark:border-slate-800
                    dark:bg-slate-900/95
                    dark:hover:border-blue-800
                  "
                >

                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      inset-0
                      -z-0
                      bg-gradient-to-br
                      from-blue-50
                      via-transparent
                      to-transparent
                      opacity-0
                      transition-opacity
                      duration-500
                      group-hover:opacity-100
                      dark:from-blue-500/10
                    "
                  />

                  <div className="relative z-10">

                    <div className="mb-6 flex items-center justify-between">

                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {index === 0 ? "Latest" : "Journal"}
                      </span>

                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {article.readingTime}
                      </span>

                    </div>

                    <h3 className="mb-4 text-2xl font-bold leading-tight text-slate-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-slate-100 dark:group-hover:text-blue-400">
                      {article.title}
                    </h3>

                    <p className="mb-6 leading-7 text-slate-600 dark:text-slate-400">
                      {article.description}
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {article.languages.map((language) => (

                        <span
                          key={language}
                          className="
                            rounded-full
                            bg-slate-100
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-slate-600
                            dark:bg-slate-800
                            dark:text-slate-400
                          "
                        >
                          {language}
                        </span>

                      ))}

                    </div>

                    <span className="mt-7 inline-flex items-center gap-1 text-sm font-medium text-blue-800 dark:text-blue-400">

                      Read article

                      <ArrowRight
                        className="
                          h-4
                          w-4
                          transition-transform
                          duration-300
                          group-hover:translate-x-1
                        "
                      />

                    </span>

                  </div>

                </Link>

              ))}

            </div>

          ) : (

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">

              <p className="text-slate-600 dark:text-slate-400">
                New reflections are on their way.
              </p>

            </div>

          )}

        </div>
      </section>

      {/* =========================================================
          NEWSLETTER
      ========================================================= */}
      <section
        className="
          relative
          z-10
          bg-slate-50/85
          px-6
          py-20
          backdrop-blur-[1px]
          dark:bg-slate-900/80
          md:py-24
        "
      >
        <div className="mx-auto max-w-5xl">

          <NewsletterForm
            title="Stay close to the journey."
            description="Learning is not a race. It unfolds slowly through curiosity, reflection, practice, and clarity. Join the SanidhyaShala newsletter for journal essays, reflections, and thoughtful updates shared when there is something worth your time."
            buttonText="Join SanidhyaShala"
          />

        </div>
      </section>

      {/* =========================================================
          FINAL INVITATION
      ========================================================= */}
      <section
        className="
          relative
          z-10
          bg-white/90
          px-6
          py-20
          backdrop-blur-[1px]
          dark:bg-slate-950/90
          md:py-24
        "
      >
        <div className="mx-auto max-w-4xl text-center">

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
            Begin anywhere
          </p>

          <h2 className="text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-5xl">
            You can begin wherever you are.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Learn something. Practise a question. Read an idea. Enter a
            reflection. Or simply follow a question that has stayed with you.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">

            <Link
              href="/learning"
              className="
                rounded-xl
                bg-blue-900
                px-6
                py-3
                font-medium
                text-white
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-blue-800
                hover:shadow-lg
                dark:bg-blue-400
                dark:text-slate-950
                dark:hover:bg-blue-300
              "
            >
              Explore Learning
            </Link>

            <Link
              href="/reflection"
              className="
                rounded-xl
                border
                border-slate-300
                bg-white
                px-6
                py-3
                font-medium
                text-slate-700
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-blue-300
                hover:text-blue-800
                hover:shadow-md
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-300
                dark:hover:border-blue-500
                dark:hover:text-blue-400
              "
            >
              Enter Reflection
            </Link>

          </div>
        </div>
      </section>

    </main>
  );
}