import Link from "next/link";

export default function Class9Page() {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-5xl font-bold text-blue-900">
          Class IX Resources
        </h1>

        <p className="mb-12 text-lg text-slate-600">
          Notes, MCQ practice, subjective questions and case-based questions
          designed to build conceptual understanding and mathematical clarity.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/learning/class-9/notes"
            className="
              rounded-2xl
              border
              bg-white
              p-8
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:border-blue-200
            "
          >
            <h2 className="mb-3 text-2xl font-bold text-blue-900">
             📘 Notes
            </h2>

            <p className="text-slate-600">
              Chapter-wise notes for conceptual understanding and revision.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Explore Notes →
            </p>
          </Link>

          <Link
            href="/learning/class-9/mcq"
            className="
              rounded-2xl
              border
              bg-white
              p-8
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:border-blue-200
            "
          >
            <h2 className="mb-3 text-2xl font-bold text-blue-900">
             📝 MCQ Practice
            </h2>

            <p className="text-slate-600">
              Multiple choice questions for practice and self-assessment.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Explore MCQs →
            </p>
          </Link>

          <Link
            href="/learning/class-9/subjective"
            className="
              rounded-2xl
              border
              bg-white
              p-8
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:border-blue-200
            "
          >
            <h2 className="mb-3 text-2xl font-bold text-blue-900">
             ✍️ Subjective Questions
            </h2>

            <p className="text-slate-600">
              Short answer and long answer questions for examination practice.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Explore Questions →
            </p>
          </Link>

          <Link
            href="/learning/class-9/case-based"
            className="
              rounded-2xl
              border
              bg-white
              p-8
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:border-blue-200
            "
          >
            <h2 className="mb-3 text-2xl font-bold text-blue-900">
             📖 Case-Based Questions
            </h2>

            <p className="text-slate-600">
              Competency-based and case-based questions aligned with the latest pattern.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Explore Case Studies →
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}