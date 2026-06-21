import Link from "next/link";

export default function Class10Page() {
return ( <main> <section className="bg-slate-50 px-6 py-20"> <div className="mx-auto max-w-5xl"> <h1 className="mb-4 text-5xl font-bold text-blue-900">
Class X Resources </h1>


      <p className="max-w-3xl text-lg leading-8 text-slate-700">
        Chapter-wise notes, MCQ practice, case-based questions,
        subjective questions and previous year questions designed
        to support CBSE Class X Mathematics preparation.
      </p>
    </div>
  </section>

  <section className="px-6 py-20">
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 md:grid-cols-2">
        
        <Link
          href="/learning/class-10/notes"
          className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <h2 className="mb-3 text-2xl font-bold text-blue-900">
            📘 Notes
          </h2>

          <p className="text-slate-600">
            Chapter-wise notes for conceptual understanding and revision.
          </p>
        </Link>

        <Link
          href="/learning/class-10/mcq"
          className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <h2 className="mb-3 text-2xl font-bold text-blue-900">
            📝 MCQ Practice
          </h2>

          <p className="text-slate-600">
            Chapter-wise multiple choice questions for practice.
          </p>
        </Link>

        <Link
          href="/learning/class-10/case-based"
          className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <h2 className="mb-3 text-2xl font-bold text-blue-900">
            📖 Case-Based Questions
          </h2>

          <p className="text-slate-600">
            Competency-based and case-study questions aligned with CBSE.
          </p>
        </Link>

        <Link
          href="/learning/class-10/subjective"
          className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <h2 className="mb-3 text-2xl font-bold text-blue-900">
            ✍️ Subjective Questions
          </h2>

          <p className="text-slate-600">
            Short answer and long answer practice questions.
          </p>
        </Link>

        <Link
          href="/learning/class-10/pyq"
          className="rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg md:col-span-2"
        >
          <h2 className="mb-3 text-2xl font-bold text-blue-900">
            📂 Previous Year Questions (PYQs)
          </h2>

          <p className="text-slate-600">
            Chapter-wise and topic-wise previous year CBSE questions.
          </p>
        </Link>

      </div>
    </div>
  </section>
</main>


);
}
