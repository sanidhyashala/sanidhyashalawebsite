type ArticleLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function ArticleLayout({
  title,
  subtitle,
  children,
}: ArticleLayoutProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <article>
        <h1 className="mb-4 text-5xl font-bold text-blue-900">
          {title}
        </h1>

        {subtitle && (
          <p className="mb-12 text-xl italic text-slate-600">
            {subtitle}
          </p>
        )}

        <div className="text-xl leading-10 text-slate-700">
          {children}
        </div>
      </article>
    </main>
  );
}