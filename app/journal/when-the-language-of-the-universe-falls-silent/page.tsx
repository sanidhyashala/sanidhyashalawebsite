import ArticleLayout from "@/app/components/ArticleLayout";
import { article } from "@/content/journal/when-the-language-of-the-universe-falls-silent";
import { articleHindi } from "@/content/journal/when-the-language-of-the-universe-falls-silent-hi";

export default function ArticlePage() {
  return (
    <ArticleLayout
      title={article.title}
      subtitle={article.subtitle}
    >
      {/* English Article */}
      {article.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-8 mt-16 text-4xl font-bold text-blue-900">
            {section.heading}
          </h2>

          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-8">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {/* Divider */}
      <hr className="my-20 border-slate-300" />

      {/* Hindi Version Heading */}
      <h1 className="mb-4 text-5xl font-bold text-blue-900">
        {articleHindi.title}
      </h1>

      <p className="mb-12 text-xl italic text-slate-600">
        {articleHindi.subtitle}
      </p>

      {/* Hindi Article */}
      {articleHindi.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-8 mt-16 text-4xl font-bold text-blue-900">
            {section.heading}
          </h2>

          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-8">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </ArticleLayout>
  );
}