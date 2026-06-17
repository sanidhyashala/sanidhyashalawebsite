import Link from "next/link";

export default function Home() {
return ( <main> <section className="bg-slate-50 px-6 py-24 text-center"> <div className="mx-auto max-w-4xl"> <h1 className="mb-4 text-6xl font-bold text-blue-900">
सानिध्यशाला </h1>

```
      <p className="mb-4 text-xl font-medium text-slate-600">
        स्पष्टता से सिद्धि तक
      </p>

      <p className="mb-4 text-2xl text-slate-700">
        Learn. Teach. Reflect.
      </p>

      <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-600">
        More than a mathematics website — a space where mathematics,
        education, philosophy and thoughtful reflection meet.
      </p>

      <Link
        href="/journal"
        className="rounded-lg bg-blue-900 px-6 py-3 text-white transition hover:bg-blue-800"
      >
        Explore Journal
      </Link>
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

      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <h3 className="mb-4 text-2xl font-semibold">
          Why Mathematics is More Than Numbers
        </h3>

        <p className="mb-6 text-slate-600">
          Mathematics is not merely a collection of formulas. It is one of
          humanity's deepest attempts to understand reality.
        </p>

        <Link
          href="/journal/why-mathematics-is-more-than-numbers"
          className="font-medium text-blue-900 hover:underline"
        >
          Read Article →
        </Link>
      </div>
    </div>
  </section>

  <section className="px-6 py-20">
    <div className="mx-auto max-w-4xl text-center">
      <h2 className="mb-6 text-4xl font-bold text-blue-900">
        A Note
      </h2>

      <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-700">
        Saanidhyashala is a journey of learning, teaching and reflection.
        It exists for those who believe that education is not merely about
        passing examinations, but about understanding reality, cultivating
        wisdom and developing clarity of thought.
      </p>
    </div>
  </section>
</main>


);
}
