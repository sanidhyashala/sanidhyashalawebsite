import Link from "next/link";

const chapters = [
{
name: "Relations and Functions",
status: "available",
pdf: "/pdfs/class-12/relations-and-functions.pdf",
},
{
name: "Inverse Trigonometric Functions",
status: "available",
pdf: "/pdfs/class-12/inverse-trigonometric-functions.pdf",
},
{
name: "Matrices",
status: "available",
pdf: "/pdfs/class-12/matrices.pdf",
},
{
name: "Determinants",
status: "available",
pdf: "/pdfs/class-12/determinants.pdf",
},
{
name: "Continuity and Differentiability",
status: "available",
pdf: "/pdfs/class-12/continuity-and-differentiability.pdf",
},
{
name: "Applications of Derivatives",
status: "available",
pdf: "/pdfs/class-12/applications-of-derivatives.pdf",
},
{
name: "Integrals",
status: "available",
pdf: "/pdfs/class-12/integrals.pdf",
},
{
name: "Applications of Integrals",
status: "available",
pdf: "/pdfs/class-12/applications-of-integrals.pdf",
},
{
name: "Differential Equations",
status: "available",
pdf: "/pdfs/class-12/differential-equations.pdf",
},
{
name: "Vector Algebra",
status: "available",
pdf: "/pdfs/class-12/vector-algebra.pdf",
},
{
name: "Three Dimensional Geometry",
status: "available",
pdf: "/pdfs/class-12/three-dimensional-geometry.pdf",
},
{
name: "Linear Programming",
status: "available",
pdf: "/pdfs/class-12/linear-programming.pdf",
},
{
name: "Probability",
status: "available",
pdf: "/pdfs/class-12/probability.pdf",
},
];

export default function NotesPage() {
return ( <main className="px-6 py-16"> <div className="mx-auto max-w-5xl"> <h1 className="mb-4 text-5xl font-bold text-blue-900">
Class 12 Notes </h1>


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
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Chapter {index + 1}
              </p>

              <h2 className="text-xl font-semibold text-blue-900">
                {chapter.name}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                🟢 Available
              </span>

              <a
                href={chapter.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  rounded-lg
                  bg-blue-900
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-800
                "
              >
                📖 Open Notes
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</main>


);
}
