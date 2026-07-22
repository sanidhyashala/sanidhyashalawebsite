import Link from "next/link";

export default function ReflectionDashboardCTA() {
  return (
    <section className="mx-auto mt-10 max-w-5xl px-6">
      <div
        className="
          group
          flex
          items-center
          justify-between
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm

          transition-all
          duration-300
          ease-out

          hover:-translate-y-1
          hover:border-blue-200
          hover:shadow-xl

          dark:border-slate-800
          dark:bg-slate-900
          dark:hover:border-blue-800
          dark:hover:shadow-black/40
        "
      >
        <div>
          <h2
            className="
              text-xl
              font-semibold
              text-blue-900

              transition-colors
              duration-300

              group-hover:text-blue-700

              dark:text-blue-400
              dark:group-hover:text-blue-300
            "
          >
            My Reflections
          </h2>

          <p
            className="
              mt-2
              text-slate-600

              transition-colors
              duration-300

              group-hover:text-slate-700

              dark:text-slate-400
              dark:group-hover:text-slate-300
            "
          >
            Track your submissions, review feedback,
            and manage every reflection you&apos;ve written.
          </p>
        </div>

        <Link
          href="/reflection/dashboard"
          className="
            rounded-2xl
            bg-blue-900
            px-6
            py-3
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
          Open Dashboard
        </Link>
      </div>
    </section>
  );
}