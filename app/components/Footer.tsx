"use client";

import Link from "next/link";
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

        {/* Contact Email */}
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
              rounded-md
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
            "
          >
            sanidhyashala.official@gmail.com
          </a>
        </p>

        {/* Legal & Support Links */}
        <nav
          aria-label="Legal and support links"
          className="
            mt-6
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-5
            gap-y-2
            text-sm
          "
        >
          <Link
            href="/privacy"
            className="
              rounded-md
              text-slate-500
              underline-offset-4
              transition-colors
              hover:text-blue-900
              hover:underline

              dark:text-slate-400
              dark:hover:text-blue-400

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:ring-offset-2
            "
          >
            Privacy Policy
          </Link>

          <span
            aria-hidden="true"
            className="text-slate-300 dark:text-slate-700"
          >
            •
          </span>

          <Link
            href="/terms"
            className="
              rounded-md
              text-slate-500
              underline-offset-4
              transition-colors
              hover:text-blue-900
              hover:underline

              dark:text-slate-400
              dark:hover:text-blue-400

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:ring-offset-2
            "
          >
            Terms of Service
          </Link>

          <span
            aria-hidden="true"
            className="text-slate-300 dark:text-slate-700"
          >
            •
          </span>

          <Link
            href="/refund-policy"
            className="
              rounded-md
              text-slate-500
              underline-offset-4
              transition-colors
              hover:text-blue-900
              hover:underline

              dark:text-slate-400
              dark:hover:text-blue-400

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:hover:text-blue-400
              focus-visible:ring-offset-2
            "
          >
            Refund & Cancellation
          </Link>

          <span
            aria-hidden="true"
            className="text-slate-300 dark:text-slate-700"
          >
            •
          </span>

          <Link
            href="/contact"
            className="
              rounded-md
              text-slate-500
              underline-offset-4
              transition-colors
              hover:text-blue-900
              hover:underline

              dark:text-slate-400
              dark:hover:text-blue-400

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-500
              focus-visible:ring-offset-2
            "
          >
            Contact
          </Link>
        </nav>

        {/* Copyright */}
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