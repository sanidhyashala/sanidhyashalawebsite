import Link from "next/link";

export default function Home() {
return ( <main> <section className="bg-slate-50 px-6 py-24 text-center"> <div className="mx-auto max-w-4xl"> <h1 className="mb-4 text-6xl font-bold text-blue-900">
सानिध्यशाला </h1>


      <p className="mb-4 text-xl font-medium text-slate-600">
        स्पष्टता से सिद्धि तक
      </p>

      <p className="mb-4 text-2xl text-slate-700">
        Learn. Teach. Reflect.
        
      </p>
      <div className="mb-8 flex flex-wrap justify-center gap-3 text-sm">
  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Mathematics
  </span>

  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Education
  </span>

  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Philosophy
  </span>

  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Reflection
  </span>
</div>

      <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-600">
        More than a mathematics website — a space where mathematics,
        education, philosophy and thoughtful reflection meet.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
  <Link
    href="/journal"
    className="rounded-lg bg-blue-900 px-6 py-3 text-white transition hover:bg-blue-800"
  >
    Explore Journal
  </Link>

  <Link
    href="/about"
    className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-slate-700 transition hover:bg-slate-100"
  >
    About Sanidhyashala
  </Link>
</div>
    </div>
  </section>

  <section className="px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-4xl font-bold text-blue-900">
        What is Sanidhyashala?
      </h2>

      <p className="text-lg leading-8 text-slate-700">
        Sanidhyashala is not merely a platform for mathematics. It is an
        invitation to think deeply, learn sincerely and reflect honestly.
      </p>

      <p className="mt-6 text-lg leading-8 text-slate-700">
        We believe that learning is not only about examinations, marks or
        careers. It is also about understanding reality, developing clarity
        of thought and discovering one's own path.
      </p>
    </div>
  </section>

  <section className="bg-slate-50 px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-8 text-4xl font-bold text-blue-900">
        Latest Journal Entry
      </h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
  <div className="mb-4 flex flex-wrap gap-2">
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
      Featured
    </span>

    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      English + हिन्दी
    </span>
  </div>

  <h3 className="mb-4 text-3xl font-bold text-blue-900">
    When the Language of the Universe Falls Silent
  </h3>

  <p className="mb-6 text-lg leading-8 text-slate-600">
    Is mathematics discovered or invented?
    A journey through Plato, the Upanishads,
    Aryabhata, Ramanujan, Einstein and the mysterious
    relationship between consciousness and truth.
  </p>

  <div className="mb-6 flex items-center gap-4 text-sm text-slate-500">
    <span>📖 18 min read</span>
    <span>🌍 Bilingual</span>
  </div>

  <Link
    href="/journal/when-the-language-of-the-universe-falls-silent"
    className="font-semibold text-blue-900 hover:underline"
  >
    Read Featured Essay →
  </Link>
</div>
    </div>
  </section>

  <section className="px-6 py-20">
    <div className="mx-auto max-w-4xl text-center">
      <h2 className="mb-6 text-4xl font-bold text-blue-900">
  Founder’s Note
</h2>

      <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-700">
  Sanidhyashala began as a simple desire — to make mathematics
  more meaningful and learning more thoughtful.

  Over time, it became something larger: a place to explore
  ideas, reflect deeply, and share insights that extend beyond
  textbooks and examinations.

  Whether you arrive here as a student, a teacher, or simply a
  curious thinker, I hope you find something that helps you see
  reality with greater clarity.
</p>
<p className="mt-8 text-lg font-semibold text-blue-900">
  — Manas
</p>
    </div>
  </section>
</main>


);
}
