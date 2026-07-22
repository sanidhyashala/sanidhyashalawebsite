import Link from "next/link";

import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({
  title,
  description,
}: ComingSoonProps) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6">

      <div
        className="
          w-full
          max-w-3xl
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-12
          text-center
          shadow-sm

          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div
          className="
            mx-auto
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-amber-100
            text-amber-600

            dark:bg-amber-900/30
            dark:text-amber-400
          "
        >
          <Construction size={38} />
        </div>

        <h1 className="mt-8 text-4xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>

        <p
          className="
            mx-auto
            mt-6
            max-w-2xl
            text-lg
            leading-8
            text-slate-600
            dark:text-slate-400
          "
        >
          {description}
        </p>

        <p
          className="
            mt-8
            text-sm
            text-slate-500
            dark:text-slate-500
          "
        >
          This module has already been planned as part of the
          SanidhyaShala ecosystem and will become available in
          a future update.
        </p>

        <Link
          href="/admin"
          className="
            mt-10
            inline-flex
            items-center
            gap-2
            rounded-2xl
            bg-slate-900
            px-6
            py-3
            text-white
            transition-colors

            hover:bg-slate-800
          "
        >
          <ArrowLeft size={18} />

          Back to Dashboard
        </Link>

      </div>

    </section>
  );
}