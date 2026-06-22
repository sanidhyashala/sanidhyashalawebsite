import Link from "next/link";

export default function Class11Page() {
return ( <main className="px-6 py-16"> <div className="mx-auto max-w-5xl"> <h1 className="mb-4 text-5xl font-bold text-blue-900">
Class XI Resources </h1>


    <p className="mb-12 text-lg text-slate-600">
      Chapter-wise notes, MCQ practice, subjective questions and
      case-based questions designed for conceptual understanding
      and examination preparation.
    </p>

    <div className="grid gap-6 md:grid-cols-2">
      <Link
        href="/learning/class-11/notes"
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
          Chapter-wise notes for conceptual clarity and revision.
        </p>
      </Link>

      <Link
        href="/learning/class-11/mcq"
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
          Chapter-wise MCQs for practice and examination preparation.
        </p>
      </Link>

      <Link
        href="/learning/class-11/subjective"
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
          Important subjective questions arranged chapter-wise.
        </p>
      </Link>

      <Link
        href="/learning/class-11/case-based"
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
          Competency-based and case-study questions aligned with
          the latest examination pattern.
        </p>
      </Link>
    </div>
  </div>
</main>


);
}
