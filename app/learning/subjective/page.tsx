import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getStudentProfile } from "@/lib/learning/student-profile";

export default async function SubjectivePage() {
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
              Subjective
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
              Sign in to access your subjective practice
              and written learning space.
            </p>

            <div className="mt-8">
              <Link
                href="/sign-in?redirect_url=/learning/subjective"
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
   * Student Profile Gate
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
              Subjective
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
   * Subjective Landing
   * ===================================================== */

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* =================================================
         * Header
         * ================================================= */}

        <section
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-8
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
            sm:p-10
            lg:p-12
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
            Subjective Practice
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
            Express what you understand.
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
            Subjective practice is where you construct,
            justify, and communicate your mathematical
            thinking — not just recognise an answer.
          </p>

          {/* Student context */}

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.program_name && (
              <span
                className="
                  rounded-full
                  bg-blue-50
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                {profile.program_name}
              </span>
            )}

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

            {profile.preferred_language && (
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
                {profile.preferred_language}
              </span>
            )}
          </div>
        </section>

        {/* =================================================
         * Two Major Modes
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
              Choose Your Practice
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
              How would you like to practise?
            </h2>

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
              Practise chapter by chapter, or prepare
              yourself through a complete board-style test.
            </p>
          </div>

          <div
            className="
              grid
              gap-5
              lg:grid-cols-2
            "
          >

            {/* =================================================
             * Chapter-wise Practice
             * ================================================= */}

            <Link
              href="/learning/subjective/chapter-wise"
              className="
                group
                flex
                min-h-[300px]
                flex-col
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-8
                shadow-sm
                transition-all
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
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-2xl
                  font-bold
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                ✎
              </div>

              <p
                className="
                  mt-7
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Practise & Improve
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
                Chapter-wise Practice
              </h3>

              <p
                className="
                  mt-3
                  max-w-xl
                  flex-1
                  text-sm
                  leading-7
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Work through individual chapters and
                strengthen your understanding through
                written solutions, reasoning, and
                application.
              </p>

              <div
                className="
                  mt-7
                  inline-flex
                  items-center
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  group-hover:gap-2
                  dark:text-blue-400
                "
              >
                Explore Chapters
                <span className="ml-1">→</span>
              </div>
            </Link>

            {/* =================================================
             * Full-Length Board Tests
             * ================================================= */}

            <Link
              href="/learning/subjective/full-length"
              className="
                group
                flex
                min-h-[300px]
                flex-col
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-8
                shadow-sm
                transition-all
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
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-2xl
                  font-bold
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                ◫
              </div>

              <p
                className="
                  mt-7
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Board Readiness
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
                Full-Length Board Tests
              </h3>

              <p
                className="
                  mt-3
                  max-w-xl
                  flex-1
                  text-sm
                  leading-7
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Simulate a complete board-style examination
                through a full answer-sheet submission and
                detailed evaluation.
              </p>

              <div
                className="
                  mt-7
                  inline-flex
                  items-center
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  group-hover:gap-2
                  dark:text-blue-400
                "
              >
                Explore Board Tests
                <span className="ml-1">→</span>
              </div>
            </Link>

          </div>
        </section>

        {/* =================================================
         * The Subjective Journey
         * ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-blue-100
            bg-gradient-to-br
            from-blue-50
            via-white
            to-slate-50
            p-8
            dark:border-blue-900/60
            dark:from-blue-950/30
            dark:via-slate-900
            dark:to-slate-950
            sm:p-10
            lg:p-12
          "
        >
          {/* Subtle Background Rings */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-64
              w-64
              rounded-full
              border
              border-blue-200/50
              dark:border-blue-800/30
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-36
              w-36
              rounded-full
              border
              border-blue-200/40
              dark:border-blue-800/20
            "
          />

          {/* Introduction */}

          <div className="relative z-10 max-w-2xl">
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
              The Subjective Journey
            </p>

            <h2
              className="
                mt-3
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
                dark:text-slate-100
                sm:text-3xl
              "
            >
              Your answer is only the beginning.
            </h2>

            <p
              className="
                mt-4
                text-base
                leading-7
                text-slate-600
                dark:text-slate-400
              "
            >
              Here, learning does not end when you submit
              an answer. You attempt, express your thinking,
              receive feedback, look again, and return with
              greater clarity.
            </p>
          </div>

          {/* Journey Steps */}

          <div className="relative z-10 mt-10">

            {/* Connecting Line */}

            <div
              aria-hidden="true"
              className="
                absolute
                left-6
                top-7
                hidden
                h-px
                w-[calc(100%-3rem)]
                bg-blue-200
                lg:block
                dark:bg-blue-900
              "
            />

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-5
              "
            >
              {[
                {
                  number: "01",
                  title: "I Begin",
                  text: "I take the first step.",
                },
                {
                  number: "02",
                  title: "I Express",
                  text: "I show what I understand.",
                },
                {
                  number: "03",
                  title: "I Discover",
                  text: "I see what needs more clarity.",
                },
                {
                  number: "04",
                  title: "I Rework",
                  text: "I learn from feedback and try again.",
                },
                {
                  number: "05",
                  title: "I Grow",
                  text: "I return with deeper understanding.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="
                    group
                    relative
                    rounded-2xl
                    border
                    border-blue-100
                    bg-white/90
                    p-5
                    transition-all
                    duration-200
                    hover:-translate-y-1
                    hover:border-blue-200
                    hover:shadow-sm
                    dark:border-blue-900/70
                    dark:bg-slate-900/90
                    dark:hover:border-blue-800
                  "
                >
                  {/* Step Number */}

                  <div
                    className="
                      relative
                      z-10
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-blue-200
                      bg-blue-50
                      text-xs
                      font-bold
                      text-blue-700
                      transition-all
                      duration-200
                      group-hover:border-blue-300
                      group-hover:bg-blue-100
                      dark:border-blue-800
                      dark:bg-blue-950
                      dark:text-blue-400
                      dark:group-hover:bg-blue-900/60
                    "
                  >
                    {step.number}
                  </div>

                  {/* Step Content */}

                  <h3
                    className="
                      mt-5
                      text-lg
                      font-bold
                      text-slate-900
                      dark:text-slate-100
                    "
                  >
                    {step.title}
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Closing Thought */}

          <div
            className="
              relative
              z-10
              mt-8
              border-t
              border-blue-100
              pt-6
              dark:border-blue-900/60
            "
          >
            <p
              className="
                max-w-2xl
                text-sm
                leading-7
                text-slate-500
                dark:text-slate-400
              "
            >
              A thoughtful attempt can reveal a gap.
              Feedback can reveal a new direction.
              And sometimes, the second attempt teaches
              more than the first one ever could.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}