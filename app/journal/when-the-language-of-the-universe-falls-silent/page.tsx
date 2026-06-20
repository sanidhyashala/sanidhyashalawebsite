import ReadingProgress from "@/app/components/ReadingProgress";
import ArticleLayout from "@/app/components/ArticleLayout";
import { article } from "@/content/journal/when-the-language-of-the-universe-falls-silent";
import { articleHindi } from "@/content/journal/when-the-language-of-the-universe-falls-silent-hi";

export default function ArticlePage() {
return (
<> <ReadingProgress />


  <ArticleLayout
  title={article.title}
  subtitle={article.subtitle}
  readingTime="18 min read"
>
    {/* English Article */}
    {article.sections.map((section) => (
      <section key={section.heading}>
        <h2 className="mb-8 mt-20 text-3xl font-bold tracking-tight text-blue-900 md:text-4xl">
          {section.heading}
        </h2>

        {section.paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-10 text-justify">
            {paragraph}
          </p>
        ))}
      </section>
    ))}

    {/* Divider */}
    <hr className="my-20 border-slate-300" />

    <div className="mb-12 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
        Hindi Version
      </p>

      <div className="mx-auto h-px w-32 bg-slate-300"></div>
    </div>

    {/* Hindi Title */}
    <h1 className="mb-4 text-5xl font-bold text-blue-900">
      {articleHindi.title}
    </h1>

    <p className="mb-12 text-xl italic text-slate-600">
      {articleHindi.subtitle}
    </p>

    {/* Hindi Article */}
    {articleHindi.sections.map((section) => (
      <section key={section.heading}>
        <h2 className="mb-8 mt-20 text-3xl font-bold tracking-tight text-blue-900 md:text-4xl">
          {section.heading}
        </h2>

        {section.paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-10 text-justify">
            {paragraph}
          </p>
        ))}
      </section>
    ))}
  </ArticleLayout>
</>


);
}
