import Link from "next/link";

export default function Class12Page() {
return ( <main className="px-6 py-16"> <div className="mx-auto max-w-5xl"> <h1 className="mb-4 text-5xl font-bold text-blue-900">
Class 12 Resources </h1>


    <p className="mb-12 text-lg text-slate-600">
      Notes, MCQs, subjective questions, case-based questions and
      previous year questions for Class 12 Mathematics.
    </p>

    <div className="grid gap-6 md:grid-cols-2">

      <Link
        href="/learning/class-12/notes"
        className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200"
      >
        <h2 className="mb-3 text-2xl font-bold text-blue-900">
          📘 Notes
        </h2>

        <p className="text-slate-600">
          Chapter-wise notes for conceptual understanding.
        </p>
      </Link>

      <Link
        href="/learning/class-12/mcq"
        className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200"
      >
        <h2 className="mb-3 text-2xl font-bold text-blue-900">
          📝 MCQ Practice
        </h2>

        <p className="text-slate-600">
          Multiple choice questions for revision and practice.
        </p>
      </Link>

      <Link
        href="/learning/class-12/subjective"
        className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200"
      >
        <h2 className="mb-3 text-2xl font-bold text-blue-900">
          ✍️ Subjective Questions
        </h2>

        <p className="text-slate-600">
          Important descriptive questions chapter-wise.
        </p>
      </Link>

      <Link
        href="/learning/class-12/case-based"
        className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200"
      >
        <h2 className="mb-3 text-2xl font-bold text-blue-900">
         📖 Case-Based Questions
        </h2>

        <p className="text-slate-600">
          Competency-based and case-study questions.
        </p>
      </Link>

      <Link
        href="/learning/class-12/pyq"
        className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200 md:col-span-2"
      >
        <h2 className="mb-3 text-2xl font-bold text-blue-900">
          📂 Previous Year Questions
        </h2>

        <p className="text-slate-600">
          Chapter-wise collection of board examination PYQs.
        </p>
      </Link>

    </div>
  </div>
</main>


);
}
