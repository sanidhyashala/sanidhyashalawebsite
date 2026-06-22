const chapters = [
{
name: "Sets",
status: "In Progress",
},
{
name: "Relations and Functions",
status: "Not Published",
},
{
name: "Trigonometric Functions",
status: "Not Published",
},
{
name: "Complex Numbers and Quadratic Equations",
status: "Not Published",
},
{
name: "Linear Inequalities",
status: "Not Published",
},
{
name: "Permutations and Combinations",
status: "Not Published",
},
{
name: "Binomial Theorem",
status: "Not Published",
},
{
name: "Sequences and Series",
status: "Not Published",
},
{
name: "Straight Lines",
status: "Not Published",
},
{
name: "Conic Sections",
status: "Not Published",
},
{
name: "Introduction to Three Dimensional Geometry",
status: "Not Published",
},
{
name: "Limits and Derivatives",
status: "Not Published",
},
{
name: "Statistics",
status: "Not Published",
},
{
name: "Probability",
status: "Not Published",
},
];

export default function NotesPage() {
return ( <main className="px-6 py-16"> <div className="mx-auto max-w-5xl"> <h1 className="mb-4 text-5xl font-bold text-blue-900">
Class 11 Subjective Questions </h1>


    <p className="mb-12 text-lg text-slate-600">
      Chapter-wise subjective questions for school examinations,
revision and conceptual understanding.
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

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                chapter.status === "Available"
                  ? "bg-green-100 text-green-700"
                  : chapter.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {chapter.status === "Available" && "🟢 "}
              {chapter.status === "In Progress" && "🟡 "}
              {chapter.status === "Not Published" && "⚪ "}
              {chapter.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
</main>


);
}
