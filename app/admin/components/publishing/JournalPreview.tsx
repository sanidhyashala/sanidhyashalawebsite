interface JournalPreviewProps {
  title: string;

  subtitle: string;

  readingTime: string;

  sections: {
    heading: string;
    paragraphs: string[];
  }[];
}

export default function JournalPreview({
  title,
  subtitle,
  readingTime,
  sections,
}: JournalPreviewProps) {
  return (
    <article
      className="
        mx-auto
        max-w-3xl
        space-y-10
      "
    >
      <header
        className="
          space-y-6
          border-b
          border-slate-200
          pb-8

          dark:border-slate-800
        "
      >
        <p
          className="
            inline-flex
            rounded-full
            bg-slate-100
            px-3
            py-1

            text-xs
            font-medium
            uppercase
            tracking-[0.2em]

            text-slate-600

            dark:bg-slate-800
            dark:text-slate-300
          "
        >
          {readingTime}
        </p>

        <h1
          className="
            text-4xl
            font-bold
            leading-tight
            tracking-tight
          "
        >
          {title}
        </h1>

        <p
          className="
            text-lg
            leading-8
            text-slate-500

            dark:text-slate-400
          "
        >
          {subtitle}
        </p>
      </header>

      {sections.map((section, index) => (
        <section
          key={index}
          className="space-y-6"
        >
          <h2
            className="
              text-2xl
              font-semibold
              tracking-tight
            "
          >
            {section.heading}
          </h2>

          {section.paragraphs.map(
            (paragraph, paragraphIndex) => (
              <p
                key={paragraphIndex}
                className="
                  text-[17px]
                  leading-8
                  text-slate-700

                  dark:text-slate-300
                "
              >
                {paragraph}
              </p>
            )
          )}
        </section>
      ))}
    </article>
  );
}