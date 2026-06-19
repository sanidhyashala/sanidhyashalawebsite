import ArticleLayout from "@/app/components/ArticleLayout";
import { article } from "@/content/journal/when-the-language-of-the-universe-falls-silent";

export default function ArticlePage() {
  return (
    <ArticleLayout
      title={article.title}
      subtitle={article.subtitle}
    >
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
    </ArticleLayout>
  );
}