const chapters = [
  { name: "Relations and Functions", status: "not-published" },
  { name: "Inverse Trigonometric Functions", status: "not-published" },
  { name: "Matrices", status: "not-published" },
  { name: "Determinants", status: "not-published" },
  { name: "Continuity and Differentiability", status: "not-published" },
  { name: "Application of Derivatives", status: "not-published" },
  { name: "Integrals", status: "not-published" },
  { name: "Application of Integrals", status: "not-published" },
  { name: "Differential Equations", status: "not-published" },
  { name: "Vector Algebra", status: "not-published" },
  { name: "Three Dimensional Geometry", status: "not-published" },
  { name: "Linear Programming", status: "not-published" },
  { name: "Probability", status: "not-published" },
];

export default function CaseBasedPage() {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-5xl font-bold text-blue-900">
          Class 12 Case-Based Questions
        </h1>

        <p className="mb-12 text-lg text-slate-600">
          Chapter-wise competency-based and case-based questions aligned
          with the latest CBSE examination pattern.
        </p>

        <div className="grid gap-4">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.name}
              className="
                rounded-xl
                border
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-md
                hover:border-blue-200
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Chapter {index + 1}
                  </p>

                  <h2 className="text-xl font-semibold text-blue-900">
                    {chapter.name}
                  </h2>
                </div>

                {chapter.status === "available" && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    🟢 Available
                  </span>
                )}

                {chapter.status === "in-progress" && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                    🟡 In Progress
                  </span>
                )}

                {chapter.status === "not-published" && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    ⚪ Not Published
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}