import Link from "next/link";

import {
  ArrowRight,
  BookPlus,
  PenSquare,
} from "lucide-react";

export default function WelcomeBanner() {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-10
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}

        <div className="max-w-2xl">

          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Welcome back 👋
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Everything inside
            <br />
            <span className="text-indigo-600">
              SanidhyaShala
            </span>{" "}
            begins here.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Manage reflections, journal articles,
            learning resources, students and the
            complete learning ecosystem from one
            place.
          </p>

        </div>

        {/* Right */}

        <div className="flex flex-col gap-4">

          <Link
            href="/admin/prompts"
            className="
              flex
              items-center
              justify-between
              rounded-2xl
              bg-slate-900
              px-6
              py-4
              text-white
              transition-all
              duration-300
              hover:scale-[1.02]
              hover:bg-slate-800
            "
          >
            <div className="flex items-center gap-3">

              <PenSquare size={20} />

              <span>Create Reflection Prompt</span>

            </div>

            <ArrowRight size={18} />

          </Link>

          <Link
  href="/admin/journal"
            className="
              flex
              items-center
              justify-between
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-6
              py-4
              transition-all
              duration-300
              hover:bg-slate-50
              dark:border-slate-700
              dark:bg-slate-900
              dark:hover:bg-slate-800
            "
          >
            <div className="flex items-center gap-3">

              <BookPlus size={20} />

              <span>
                Journal Publishing Studio
              </span>

            </div>

            <ArrowRight size={18} />

          </Link>

        </div>

      </div>
    </section>
  );
}