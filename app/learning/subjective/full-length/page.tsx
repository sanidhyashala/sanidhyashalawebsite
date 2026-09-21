import Link from "next/link";

export default function FullLengthSubjectivePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl text-center">

        <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
          Coming Soon
        </div>

        <h1 className="mb-6 text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-5xl">
          Full-Length Subjective Practice
        </h1>

        <p className="mx-auto mb-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 md:text-xl">
          Some practice is not about solving a single question.
          It is about discovering how you think across an entire
          examination — how you approach a problem, organize your
          reasoning, and carry your understanding from one question
          to the next.
        </p>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-8 text-slate-500 dark:text-slate-400">
          Full-Length Subjective Practice is being designed as the next
          step in that journey. It will be more than a collection of
          questions — it will be an opportunity to experience and
          understand your complete problem-solving journey.
        </p>

        <div className="mx-auto mb-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">
            This space is being prepared.
          </h2>

          <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
            We will make it available soon — thoughtfully designed to
            become a meaningful part of the SanidhyaShala learning
            experience.
          </p>
        </div>

        <Link
          href="/learning/subjective"
          className="inline-flex items-center rounded-lg bg-blue-900 px-6 py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md dark:bg-blue-400 dark:text-slate-950 dark:hover:bg-blue-300"
        >
          ← Back to Subjective Practice
        </Link>

      </div>
    </main>
  );
}