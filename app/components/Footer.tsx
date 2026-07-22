"use client";

import { usePathname } from "next/navigation";

export default function Footer() {

  const pathname = usePathname();

const isAdmin = pathname.startsWith("/admin");

if (isAdmin) {
  return null;
}

  return (
    <footer
      className="
        mt-auto
        border-t
        border-slate-200
        bg-slate-50

        dark:border-slate-800
        dark:bg-slate-950

        py-8

        transition-colors
        duration-300
      "
    >
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h3
          className="
            text-xl
            font-semibold
            tracking-tight

            text-blue-900
            dark:text-blue-400
          "
        >
          सानिध्यशाला
        </h3>

        <p
          className="
            mx-auto
            mt-4
            max-w-[32rem]
            leading-relaxed

            text-slate-600
            dark:text-slate-400
          "
        >
          Learning deeply. Teaching thoughtfully. Reflecting honestly.
        </p>

        <p
          className="
            mt-4

            text-slate-500
            dark:text-slate-500
          "
        >
          <a
            href="mailto:sanidhyashala.official@gmail.com"
            className="
              font-medium
              underline-offset-4

              transition-colors
              duration-200

              hover:underline

              text-slate-600
              hover:text-blue-900

              dark:text-slate-400
              dark:hover:text-blue-400

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:ring-offset-2

              rounded-md
            "
          >
            sanidhyashala.official@gmail.com
          </a>
        </p>

        <p
          className="
            mt-5
            text-xs
            font-light

            text-slate-400
            dark:text-slate-600
          "
        >
          © {new Date().getFullYear()} Sanidhyashala. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}