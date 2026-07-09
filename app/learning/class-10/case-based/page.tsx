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

export default function CaseBasedPage() {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-5xl font-bold text-blue-900 dark:text-blue-400">
          Class X Case-Based Questions
        </h1>

        <p className="mb-12 text-lg text-slate-600 dark:text-slate-400">
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
                dark:bg-slate-900
                dark:border-slate-800
                dark:shadow-none
                dark:hover:border-slate-700
                dark:hover:shadow-lg
                dark:hover:shadow-black/30
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chapter {index + 1}
                  </p>

                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-400">
                    {chapter.name}
                  </h2>
                </div>

                {chapter.status === "available" && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                    🟢 Available
                  </span>
                )}

                {chapter.status === "in-progress" && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
                    🟡 In Progress
                  </span>
                )}

                {chapter.status === "not-published" && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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