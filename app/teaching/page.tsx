import ArticleLayout from "@/app/components/ArticleLayout";
import { teaching } from "@/content/teaching/teaching";

export default function TeachingPage() {
  const englishSections = teaching.sections.filter(
    (section) => !/^[ऀ-ॿ]/.test(section.heading)
  );

  const hindiSections = teaching.sections.filter(
    (section) => /^[ऀ-ॿ]/.test(section.heading)
  );

  return (
    <ArticleLayout
      title={teaching.title}
      subtitle={teaching.subtitle}
    >
      <>
        {/* English Sections */}
        {englishSections.map((section) => (
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
<div className="my-24 flex items-center">
  <div className="h-px flex-1 bg-slate-300"></div>

  <span className="mx-6 text-sm font-medium tracking-widest text-slate-500 uppercase">
    Hindi Edition
  </span>

  <div className="h-px flex-1 bg-slate-300"></div>
</div>

<div className="mb-16 text-center">
  <h2 className="text-4xl font-bold text-blue-900">
    हिन्दी संस्करण
  </h2>

  <p className="mt-3 text-slate-600">
    Teaching in Hindi
  </p>
</div>

        {/* Hindi Sections */}
        {hindiSections.map((section) => (
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
      </>
    </ArticleLayout>
  );
}