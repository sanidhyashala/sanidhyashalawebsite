import Link from "next/link";

export default function JournalPage() {
  const posts = [
    {
      title: "Why Mathematics is More Than Numbers",
      description:
        "Exploring how mathematics teaches us to think, question and discover patterns in life.",
      slug: "why-mathematics-is-more-than-numbers",
    },
    {
      title: "When the Language of the Universe Falls Silent",
      description:
        "Is mathematics discovered or invented? A journey through philosophy, science and the search for truth.",
      slug: "when-the-language-of-the-universe-falls-silent",
      languages: ["English", "Hindi"],
    },
    {
      title: "Learning and Swadharma",
      description:
        "Can education help us discover our true path in life?",
      slug: "learning-and-swadharma",
    },
    {
      title: "The Purpose of Education",
      description:
        "Beyond marks, exams and careers—what is education really for?",
      slug: "the-purpose-of-education",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-4 text-5xl font-bold text-blue-900">
        Journal
      </h1>

      <p className="mb-12 text-lg text-slate-600">
        Reflections on learning, mathematics, education and life.
      </p>

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              {post.title}
            </h2>

            <p className="mb-4 text-slate-600">
              {post.description}
            </p>

            <div className="mb-4 flex gap-2">
  {post.languages?.includes("English") && (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
      🇬🇧 English
    </span>
  )}

  {post.languages?.includes("Hindi") && (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800">
      🇮🇳 हिन्दी
    </span>
  )}
</div>

            <Link
              href={`/journal/${post.slug}`}
              className="font-medium text-blue-900 hover:underline"
            >
              Read Article →
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}