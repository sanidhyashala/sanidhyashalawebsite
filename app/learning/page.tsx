import Link from "next/link";

export default function LearningPage() {
  return (
    <main className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-10 text-5xl font-bold text-blue-900">
          Learning Resources
        </h1>

        <div className="grid gap-6 md:grid-cols-2">

          <Link
            href="/learning/class-9"
            className="block rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-blue-900">Class IX</h2>
            <p className="mt-3 text-slate-600">
              Notes, MCQ Practice and Subjective Questions
            </p>
          </Link>

          <Link
            href="/learning/class-10"
            className="block rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-blue-900">Class X</h2>
            <p className="mt-3 text-slate-600">
              Notes, MCQs, Case-Based Questions, Subjective Questions and PYQs
            </p>
          </Link>

          <Link
            href="/learning/class-11"
            className="block rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-blue-900">Class XI</h2>
            <p className="mt-3 text-slate-600">
              Notes, MCQ Practice and Subjective Questions
            </p>
          </Link>

          <Link
            href="/learning/class-12"
            className="block rounded-2xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-blue-900">Class XII</h2>
            <p className="mt-3 text-slate-600">
              Notes, MCQs, Case-Based Questions, Subjective Questions and PYQs
            </p>
          </Link>

        </div>
      </div>
    </main>
  );
}