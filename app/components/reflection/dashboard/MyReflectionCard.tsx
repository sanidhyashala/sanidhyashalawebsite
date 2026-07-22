import type { Reflection } from "@/app/lib/reflection/reflection-types";

import ReflectionCardActions from "./ReflectionCardActions";

function getStatusStyle(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

    case "rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";

    case "archived":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

interface Props {
  reflection: Reflection;
}

export default function MyReflectionCard({
  reflection,
}: Props) {
  return (
    <article
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-6

        shadow-sm

        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-xl
        hover:shadow-blue-500/10

        dark:border-slate-800
        dark:bg-slate-900
        dark:hover:border-blue-700/40
        dark:hover:shadow-blue-900/20
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">

          <h2
            className="
              text-xl
              font-semibold

              text-blue-900
              dark:text-blue-400
            "
          >
            {reflection.question}
          </h2>

          <p
            className="
              mt-3
              line-clamp-3
              leading-8

              text-slate-600
              dark:text-slate-300
            "
          >
            {reflection.content}
          </p>

          {reflection.status === "rejected" &&
            reflection.rejectionReason && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-5

                  dark:border-red-900/40
                  dark:bg-red-950/30
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold

                    text-red-700
                    dark:text-red-300
                  "
                >
                  Rejection Feedback
                </p>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-7

                    text-red-600
                    dark:text-red-200
                  "
                >
                  {reflection.rejectionReason}
                </p>
              </div>
            )}
        </div>

        <span
          className={`
            rounded-full
            px-4
            py-1.5
            text-xs
            font-semibold
            uppercase
            tracking-wide

            ${getStatusStyle(reflection.status)}
          `}
        >
          {reflection.status}
        </span>
      </div>

      <div
        className="
          mt-8
          flex
          items-center
          justify-between

          border-t
          border-slate-100
          pt-5

          dark:border-slate-800
        "
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {new Date(reflection.createdAt).toLocaleDateString("en-IN")}
        </p>

        <ReflectionCardActions
          reflectionId={reflection.id}
          status={reflection.status}
        />
      </div>
    </article>
  );
}