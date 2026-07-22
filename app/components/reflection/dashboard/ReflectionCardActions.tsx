import Link from "next/link";

import type { ReflectionStatus } from "@/app/lib/reflection/reflection-types";

interface Props {
  reflectionId: string;
  status: ReflectionStatus;
}

export default function ReflectionCardActions({
  reflectionId,
  status,
}: Props) {
  switch (status) {
    case "pending":
      return (
        <span
          className="
            rounded-full
            bg-amber-100
            px-4
            py-2
            text-sm
            font-medium
            text-amber-700

            dark:bg-amber-900/30
            dark:text-amber-300
          "
        >
          Awaiting Review
        </span>
      );

    case "published":
      return (
        <Link
          href={`/reflection/dashboard/${reflectionId}`}
          className="
            rounded-xl

            bg-blue-900
            px-5
            py-2.5

            text-sm
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
          View Reflection
        </Link>
      );

    case "rejected":
      return (
        <Link
          href={`/reflection/edit/${reflectionId}`}
          className="
            rounded-xl

            bg-red-600
            px-5
            py-2.5

            text-sm
            font-medium
            text-white

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:bg-red-700
            hover:shadow-lg
            hover:shadow-red-500/20

            active:translate-y-0

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-red-500
            focus-visible:ring-offset-2
            dark:focus-visible:ring-offset-slate-900
          "
        >
          Edit & Resubmit
        </Link>
      );

    case "archived":
      return (
        <Link
          href={`/reflection/dashboard/${reflectionId}`}
          className="
            rounded-xl

            border
            border-slate-300

            bg-white
            px-5
            py-2.5

            text-sm
            font-medium
            text-slate-700

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:border-blue-300
            hover:text-blue-700
            hover:shadow-md

            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:border-blue-500
            dark:hover:text-blue-400
          "
        >
          View Archive
        </Link>
      );

    default:
      return null;
  }
}