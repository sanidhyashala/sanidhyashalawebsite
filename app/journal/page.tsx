import Link from "next/link";

import { journalArticles } from "@/content/journal";
import JournalSearch from "@/app/components/journal/JournalSearch";

import NewsletterForm from "@/app/components/newsletter/NewsletterForm";

import SavedArticlesDrawer from "@/app/components/journal/SavedArticlesDrawer";

export default function JournalPage() {
  const posts = Object.entries(journalArticles);

  const placementSections = [
  {
    placement: "featured",
    title: "Featured Reflection",
  },

  {
    placement: "editors-choice",
    title: "Editor's Choice",
  },

  {
    placement: "most-curious",
    title: "Most Curious",
  },

  {
    placement: "staff-pick",
    title: "Staff Pick",
  },

  {
    placement: "recommended",
    title: "Recommended Reading",
  },
] as const;

const featuredPost = posts.find(([, data]) =>
  data.meta.placements?.includes("featured")
);

const highlightedArticles = placementSections
  .map((section) => {
    const article = posts.find(([, data]) =>
      data.meta.placements?.includes(section.placement)
    );

    return article
      ? {
          ...section,
          article,
        }
      : null;
  })
  .filter(Boolean);



const remainingPosts = posts.filter(
  ([slug]) => {
    const article = posts.find(
      ([currentSlug]) => currentSlug === slug
    );

    return !article?.[1].meta.placements?.includes(
      "featured"
    );
  }
);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      {/* Header */}
      <section className="mb-14 text-center md:mb-16">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-6xl">
          Journal
        </h1>

        <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Reflections on learning, mathematics, philosophy, education and
          life.
        </p>
      </section>

      {/* Search */}
      <div className="mb-16 flex flex-col md:flex-row md:items-start">
        <div className="flex flex-1 items-start gap-3">
          <div className="flex-1">
            <JournalSearch />
          </div>

          <SavedArticlesDrawer />
        </div>
      </div>

      {/* Featured Section */}
      {featuredPost && (
        <section className="mb-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Featured Reflection
          </p>

          <Link
            href={`/journal/${featuredPost[0]}`}
            className="group relative block overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:focus-visible:ring-offset-slate-950 md:p-10"
          >
            {/* Animated gradient wash, appears on hover */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-100/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 dark:from-blue-500/10"
            />

            <div className="relative z-10">
              <h2 className="mb-4 text-4xl font-bold text-blue-900 transition-colors duration-300 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300 md:text-5xl">
                {featuredPost[1].meta.title}
              </h2>

              <div className="mb-4 flex flex-wrap gap-2">
  {featuredPost[1].meta.languages.includes("English") && (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
      🇬🇧 English
    </span>
  )}

  {featuredPost[1].meta.languages.includes("Hindi") && (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
      🇮🇳 हिन्दी
    </span>
  )}

  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
    ⏱ {featuredPost[1].meta.readingTime}
  </span>
</div>

              <p className="max-w-2xl leading-relaxed text-slate-600 dark:text-slate-300">
                {featuredPost[1].meta.description}
              </p>

              <span className="mt-6 inline-flex items-center text-sm font-medium text-blue-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                Read the reflection
                <span
                  aria-hidden="true"
                  className="ml-1 transition-transform duration-300 ease-out group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Secondary Highlights */}
<div className="mb-24 grid gap-6 md:grid-cols-2 md:gap-8">
  {highlightedArticles
    .filter(
      (item) => item?.placement !== "featured"
    )
    .map((item) => {
      const [slug, articleData] = item!.article;

      const accentStyles = {
  "editors-choice": {
    border: "hover:border-green-300",
    shadow: "hover:shadow-green-100/60",
    label: "text-green-600",
    title: "group-hover:text-green-800 dark:group-hover:text-green-400",
    dot: "bg-green-500",
  },

  "most-curious": {
    border: "hover:border-purple-300",
    shadow: "hover:shadow-purple-100/60",
    label: "text-purple-600",
    title: "group-hover:text-purple-800 dark:group-hover:text-purple-400",
    dot: "bg-purple-500",
  },

  "staff-pick": {
    border: "hover:border-amber-300",
    shadow: "hover:shadow-amber-100/60",
    label: "text-amber-600",
    title: "group-hover:text-amber-800 dark:group-hover:text-amber-400",
    dot: "bg-amber-500",
  },

  "recommended": {
    border: "hover:border-rose-300",
    shadow: "hover:shadow-rose-100/60",
    label: "text-rose-600",
    title: "group-hover:text-rose-800 dark:group-hover:text-rose-400",
    dot: "bg-rose-500",
  },
} as const;

const style =
  accentStyles[
    item!.placement as keyof typeof accentStyles
  ];

      return (
        <Link
          key={slug}
          href={`/journal/${slug}`}
          className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${style?.border ?? ""} ${style?.shadow ?? ""} dark:border-slate-800 dark:bg-slate-900`}
        >
          <div className="relative z-10">
            <p
  className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${style?.label ?? "text-slate-500"}`}
>
  <span
    className={`h-1.5 w-1.5 rounded-full ${style?.dot ?? "bg-slate-500"}`}
  />
              {item!.title}
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
  {articleData.meta.languages.includes("English") && (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
      🇬🇧 English
    </span>
  )}

  {articleData.meta.languages.includes("Hindi") && (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
      🇮🇳 हिन्दी
    </span>
  )}

  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
    ⏱ {articleData.meta.readingTime}
  </span>
</div>

            <h3
  className={`mb-3 text-2xl font-bold text-slate-900 transition-colors duration-300 ${style?.title ?? ""} dark:text-slate-100`}
>
              {articleData.meta.title}
            </h3>

            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              {articleData.meta.description}
            </p>
          </div>
        </Link>
      );
    })}
</div>

      {/* Articles */}
      <section>
        <h2 className="mb-10 text-3xl font-bold text-blue-900 dark:text-blue-400">
          Latest Articles
        </h2>

        {remainingPosts.length > 0 ? (
          <div className="space-y-6">
            {remainingPosts.map(([slug, data]) => (
              <article
                key={slug}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:shadow-black/30 md:p-7"
              >
                <h3 className="mb-2 text-2xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-slate-100 dark:group-hover:text-blue-400">
                  <Link
                    href={`/journal/${slug}`}
                    className="static rounded-2xl before:absolute before:inset-0 before:z-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
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
                      className="relative z-10 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:scale-[1.03] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {category}
                    </Link>
                  ))}
                </div>

                <span className="relative z-10 mt-5 inline-flex items-center text-sm font-medium text-blue-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                  Read Article
                  <span
                    aria-hidden="true"
                    className="ml-1 transition-transform duration-300 ease-out group-hover:translate-x-1"
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
      <section className="mt-28 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-900 to-slate-900 px-8 py-16 text-center shadow-sm dark:border-slate-800 md:px-16">
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