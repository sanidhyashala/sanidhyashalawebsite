import type { Metadata } from "next";
import { Clock3, Settings, BookOpen } from "lucide-react";

import AdminPage from "../components/layout/AdminPage";

export const metadata: Metadata = {
  title: "Settings | SanidhyaShala Admin",
  description:
    "SanidhyaShala Admin Settings module is currently under development.",
};

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <AdminPage
      title="Settings"
      description="The Settings module is currently under development."
      sectionTitle="Settings"
    >
      <div className="flex min-h-[calc(100vh-230px)] items-center justify-center py-10">
        <div className="w-full max-w-2xl text-center">
          {/* Settings Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40">
            <Settings
              className="h-10 w-10 text-blue-600 dark:text-blue-400"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </div>

          {/* Heading */}
          <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Settings Module{" "}
            <span className="text-blue-600 dark:text-blue-400">
              Coming Soon
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            We are currently working on the Settings module for
            SanidhyaShala. This space will soon provide a central place
            to manage platform and administrative settings.
          </p>

          {/* Development Status Card */}
          <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                <Clock3
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
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

          {/* SanidhyaShala Philosophy */}
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />

            <BookOpen
              className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />

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