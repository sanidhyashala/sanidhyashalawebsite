

const chapters = [
{
name: "Orienting Yourself: The Use of Coordinates",
status: "In Progress",
},
{
name: "Introduction to Linear Polynomials",
status: "Not Published",
},
{
name: "The World of Numbers",
status: "Not Published",
},
{
name: "Exploring Algebraic Identities",
status: "Not Published",
},
{
name: "I'm Up and Down, and Round and Round",
status: "Not Published",
},
{
name: "Measuring Space: Perimeter and Area",
status: "Not Published",
},
{
name: "The Mathematics of Maybe: Introduction to Probability",
status: "Not Published",
},
{
name: "Predicting What Comes Next: Exploring Sequences and Progressions",
status: "Not Published",
},
];

export default function NotesPage() {
return ( <main className="px-6 py-16"> <div className="mx-auto max-w-5xl"> <h1 className="mb-4 text-5xl font-bold text-blue-900">
Class 9 Notes </h1>


    <p className="mb-12 text-lg text-slate-600">
      Chapter-wise notes designed to build conceptual clarity and
      mathematical understanding.
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
