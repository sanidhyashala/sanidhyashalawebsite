import Link from "next/link";

import { journalArticles } from "@/content/journal";
import JournalSearch from "@/app/components/journal/JournalSearch";

import NewsletterForm from "@/app/components/newsletter/NewsletterForm";

export default function JournalPage() {
  const posts = Object.entries(journalArticles);

  const featuredPost = posts.find(([, data]) => data.meta.featured);

  const remainingPosts = posts.filter(([, data]) => !data.meta.featured);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold text-blue-900 dark:text-blue-400 md:text-6xl">
          Journal
        </h1>

        <p className="mx-auto max-w-3xl text-lg text-slate-600 dark:text-slate-400">
          Reflections on learning, mathematics, philosophy, education and
          life.
        </p>
      </section>

      {/* Search */}
      <div className="mb-16">
        <JournalSearch />
      </div>

      {/* Featured Hero */}
      {featuredPost && (
        <section className="mb-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Featured Reflection
          </p>

          <div className="group relative rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:hover:shadow-black/30 md:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                ★ Featured
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ⏱ {featuredPost[1].meta.readingTime}
              </span>
            </div>

            <h2 className="mb-4 text-4xl font-bold leading-tight text-blue-900 transition-colors duration-300 group-hover:text-blue-800 dark:text-blue-400 dark:group-hover:text-blue-300 md:text-5xl">
              <Link
                href={`/journal/${featuredPost[0]}`}
                className="static before:absolute before:inset-0 before:z-0 before:content-['']"
              >
                {featuredPost[1].meta.title}
              </Link>
            </h2>

            <p className="mb-8 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              {featuredPost[1].meta.description}
            </p>

            <div className="relative z-10 mb-6 flex flex-wrap gap-2">
              {featuredPost[1].meta.categories.map((category) => (
                <Link
                  key={category}
                  href={`/journal/category/${category.toLowerCase()}`}
                  className="relative z-10 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                >
                  {category}
                </Link>
              ))}
            </div>

            <span className="relative z-10 inline-flex items-center text-sm font-semibold text-blue-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
              Read Featured Article
              <span
                aria-hidden="true"
                className="ml-1 transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </div>
        </section>
      )}

      {/* Articles */}
      <section>
        <h2 className="mb-8 text-3xl font-bold text-blue-900 dark:text-blue-400">
          Latest Articles
        </h2>

        {remainingPosts.length > 0 ? (
          <div className="space-y-6">
            {remainingPosts.map(([slug, data]) => (
              <article
                key={slug}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:shadow-black/30 md:p-7"
              >
                <h3 className="mb-2 text-2xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-slate-100 dark:group-hover:text-blue-400">
                  <Link
                    href={`/journal/${slug}`}
                    className="static before:absolute before:inset-0 before:z-0 before:content-['']"
                  >
                    {data.meta.title}
                  </Link>
                </h3>

                <p className="mb-5 leading-relaxed text-slate-600 dark:text-slate-300">
                  {data.meta.description}
                </p>

                <div className="relative z-10 flex flex-wrap items-center gap-2">
                  {data.meta.languages.includes("English") && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      🇬🇧 English
                    </span>
                  )}

                  {data.meta.languages.includes("Hindi") && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                      🇮🇳 हिन्दी
                    </span>
                  )}

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    ⏱ {data.meta.readingTime}
                  </span>

                  {data.meta.categories.map((category) => (
                    <Link
                      key={category}
                      href={`/journal/category/${category.toLowerCase()}`}
                      className="relative z-10 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {category}
                    </Link>
                  ))}
                </div>

                <span className="relative z-10 mt-5 inline-flex items-center text-sm font-medium text-blue-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                  Read Article
                  <span
                    aria-hidden="true"
                    className="ml-1 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No articles yet
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              New reflections are on their way. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="mt-20 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-900 to-slate-900 px-8 py-16 text-center shadow-sm md:px-16">
        <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
          Stay Connected
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-blue-100">
          Occasional letters on mathematics, teaching and the ideas behind
          them — thoughtful, unhurried, and worth your time.
        </p>

        <div className="mx-auto max-w-md">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}