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
return ( <main className="mx-auto max-w-3xl px-6 py-16"> <article> <h1 className="mb-4 text-5xl font-bold text-blue-900">
{title} </h1>


    {subtitle && (
      <p className="mb-6 text-xl italic text-slate-600">
        {subtitle}
      </p>
    )}

    {readingTime && (
      <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          📖 {readingTime}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1">
          🇬🇧 English + 🇮🇳 हिन्दी
        </span>
      </div>
    )}

    <div
      className="
        prose
        prose-lg
        max-w-none

        prose-headings:text-blue-900
        prose-headings:font-bold

        prose-p:text-slate-700
        prose-p:leading-9

        prose-strong:text-slate-900

        prose-blockquote:border-blue-300
        prose-blockquote:text-slate-600
      "
    >
      {children}
    </div>
  </article>
</main>


);
}
