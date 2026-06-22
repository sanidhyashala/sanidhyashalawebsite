const chapters = [
  { name: "Real Numbers", status: "available" },
  { name: "Polynomials", status: "not-published" },
  { name: "Pair of Linear Equations in Two Variables", status: "not-published" },
  { name: "Quadratic Equations", status: "not-published" },
  { name: "Arithmetic Progressions", status: "not-published" },
  { name: "Triangles", status: "not-published" },
  { name: "Coordinate Geometry", status: "not-published" },
  { name: "Introduction to Trigonometry", status: "not-published" },
  { name: "Some Applications of Trigonometry", status: "not-published" },
  { name: "Circles", status: "not-published" },
  { name: "Areas Related to Circles", status: "not-published" },
  { name: "Surface Areas and Volumes", status: "not-published" },
  { name: "Statistics", status: "not-published" },
  { name: "Probability", status: "not-published" },
];

export default function MCQPage() {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-5xl font-bold text-blue-900">
          Class 10 MCQ Practice
        </h1>

        <p className="mb-12 text-lg text-slate-600">
          Chapter-wise multiple choice questions designed for revision,
          concept checking and examination preparation.
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