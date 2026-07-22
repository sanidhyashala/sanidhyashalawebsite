import Link from "next/link";

import ReflectionEmpty from "./ReflectionEmpty";
import ReflectionItem from "./ReflectionItem";

import { Reflection } from "@/app/lib/reflection/reflection-types";

interface ReflectionFeedProps {
  reflections: Reflection[];
}

export default function ReflectionFeed({
  reflections,
}: ReflectionFeedProps) {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto max-w-5xl">

        {/* Hero */}

        <div className="mb-20 text-center">

          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.3em]

              text-blue-700
              dark:text-blue-400
            "
          >
            Community Reflections
          </p>

          <h1
            className="
              mt-6
              text-5xl
              font-semibold
              tracking-tight

              text-blue-900
              dark:text-blue-400
            "
          >
            Published Reflections
          </h1>

          <p
            className="
              mx-auto
              mt-8
              max-w-3xl

              text-lg
              leading-9

              text-slate-600
              dark:text-slate-300
            "
          >
            Not every reflection begins with certainty.
            Some begin with a quiet question, others with a
            moment that refused to disappear.
            <br />
            <br />
            These reflections have been thoughtfully shared
            with the SanidhyaShala community.
          </p>

        </div>

        {reflections.length === 0 ? (
          <ReflectionEmpty />
        ) : (
          <div className="space-y-10">
            {reflections.map((reflection) => (
              <ReflectionItem
                key={reflection.id}
                reflection={reflection}
              />
            ))}
          </div>
        )}

        {/* Archive Card */}

        <div
          className="
            mt-24

            rounded-[2rem]

            border
            border-slate-200

            bg-white

            px-10
            py-14

            text-center

            shadow-sm

            transition-all
            duration-300

            hover:-translate-y-1
            hover:border-blue-200
            hover:shadow-xl
            hover:shadow-blue-500/10

            dark:border-slate-800
            dark:bg-slate-900

            dark:hover:border-blue-500/40
            dark:hover:shadow-blue-500/10
          "
        >
          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.25em]

              text-blue-700
              dark:text-blue-400
            "
          >
            Reflection Archive
          </p>

          <h2
            className="
              mt-5

              text-4xl
              font-semibold
              tracking-tight

              text-blue-900
              dark:text-blue-400
            "
          >
            Every question leaves a trace.
          </h2>

          <p
            className="
              mx-auto
              mt-8
              max-w-2xl

              text-lg
              leading-9

              text-slate-600
              dark:text-slate-300
            "
          >
            Explore reflections from previous prompts and
            witness how different minds have responded to
            different questions over time.
          </p>

          <Link
            href="/reflection/archive"
            className="
              mt-10
              inline-flex
              items-center
              justify-center

              rounded-full

              bg-blue-900

              px-8
              py-4

              text-base
              font-medium
              text-white

              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:bg-blue-800
              hover:shadow-lg
              hover:shadow-blue-500/20

              active:translate-y-0

              dark:bg-blue-600
              dark:hover:bg-blue-500
              dark:hover:shadow-blue-500/30

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-slate-900
            "
          >
            Explore Reflection Archive →
          </Link>
        </div>

      </div>
    </section>
  );
}