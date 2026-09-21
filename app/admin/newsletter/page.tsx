import type { Metadata } from "next";

import AdminPage from "../components/layout/AdminPage";

export const metadata: Metadata = {
  title: "Newsletter | SanidhyaShala Admin",
  description:
    "SanidhyaShala Newsletter module is currently under development.",
};

export const dynamic = "force-dynamic";

export default function AdminNewsletterPage() {
  return (
    <AdminPage
      title="Newsletter"
      description="The Newsletter module is currently under development."
      sectionTitle="Newsletter"
    >
      <div className="flex min-h-[calc(100vh-230px)] items-center justify-center py-10">
        <div className="w-full max-w-2xl text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40">
            <svg
              className="h-10 w-10 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8.5 12 14l9-5.5"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.5 18 5.2-5.1M20.5 18l-5.2-5.1"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Newsletter Module{" "}
            <span className="text-blue-600 dark:text-blue-400">
              Coming Soon
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            We are currently working on the Newsletter module for
            SanidhyaShala. This space will soon be available for managing
            newsletters and keeping our learning community connected.
          </p>

          {/* Status Card */}
          <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />

                  <path
                    strokeLinecap="round"
                    d="M12 7v5l3 2"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  In Development
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Work on this module will begin soon. Once the
                  implementation is complete, this section will become
                  live from the admin dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />

            <svg
              className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6.5c2.5-1.5 5-1.5 8 0v12c-3-1.5-5.5-1.5-8 0v-12Zm16 0c-2.5-1.5-5-1.5-8 0v12c3-1.5 5.5-1.5 8 0v-12Z"
              />
            </svg>

            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <p className="mt-5 text-sm italic text-slate-500 dark:text-slate-400">
            From Clarity to Mastery
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            SanidhyaShala
          </p>
        </div>
      </div>
    </AdminPage>
  );
}