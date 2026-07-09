type ArticleLayoutProps = {
  title: string;
  subtitle?: string;
  readingTime?: string;
  children: React.ReactNode;
};

export default function ArticleLayout({
  title,
  subtitle,
  readingTime,
  children,
}: ArticleLayoutProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <article>
        <h1 className="mb-4 text-4xl md:text-5xl font-bold text-blue-900 dark:text-blue-400">
          {title}
        </h1>

        {subtitle && (
          <p className="mb-6 text-xl italic text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}

        {readingTime && (
          <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 dark:border dark:border-slate-700 px-3 py-1">
              📖 {readingTime}
            </span>

            <span className="rounded-full bg-slate-100 dark:bg-slate-800 dark:border dark:border-slate-700 px-3 py-1">
              🇬🇧 English + 🇮🇳 हिन्दी
            </span>
          </div>
        )}

        <div
          className="
            prose
            prose-lg
            max-w-none

            dark:prose-invert

            prose-headings:text-blue-900
            prose-headings:font-bold
            dark:prose-headings:text-blue-400

            prose-p:text-slate-700
            prose-p:leading-10
            dark:prose-p:text-slate-300

            prose-strong:text-slate-900
            dark:prose-strong:text-white

            prose-a:text-blue-700
            prose-a:no-underline
            prose-a:font-medium
            hover:prose-a:underline
            dark:prose-a:text-blue-400

            prose-li:text-slate-700
            dark:prose-li:text-slate-300

            prose-code:text-blue-700
            prose-code:bg-slate-100
            prose-code:rounded
            prose-code:px-1.5
            prose-code:py-0.5
            prose-code:font-normal
            prose-code:before:content-none
            prose-code:after:content-none
            dark:prose-code:text-blue-300
            dark:prose-code:bg-slate-800

            prose-pre:bg-slate-100
            dark:prose-pre:bg-slate-800

            prose-blockquote:border-blue-300
            prose-blockquote:text-slate-600
            dark:prose-blockquote:border-blue-500
            dark:prose-blockquote:text-slate-300
          "
        >
          {children}
        </div>
      </article>
    </main>
  );
}