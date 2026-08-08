interface JournalPublishSuccessProps {
  slug: string;
  readingTime: string;
}

export default function JournalPublishSuccess({
  slug,
  readingTime,
}: JournalPublishSuccessProps) {
  return (
    <section
      className="
        rounded-3xl
        border
        border-emerald-200
        bg-emerald-50
        p-8

        dark:border-emerald-800
        dark:bg-emerald-950/30
      "
    >
      <div className="space-y-6">

        <div>
          <h2 className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
            ✅ Journal Generated Successfully
          </h2>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            All required files have been generated successfully.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Slug
            </p>

            <p className="mt-1 font-mono text-slate-900 dark:text-white">
              {slug}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Reading Time
            </p>

            <p className="mt-1 text-slate-900 dark:text-white">
              {readingTime}
            </p>
          </div>

        </div>

        <div>

          <p className="mb-3 text-sm font-medium text-slate-500">
            Generated Files
          </p>

          <ul className="space-y-2 text-sm">

            <li>✓ articleHindi.ts</li>

            <li>✓ articleEnglish.ts</li>

            <li>✓ meta.ts</li>

            <li>✓ index.ts</li>

          </ul>

        </div>

      </div>
    </section>
  );
}