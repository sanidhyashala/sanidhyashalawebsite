"use client";

import { useState } from "react";

import type {
  JournalArticle,
} from "@/content/journal/types";

interface JournalContentProps {
  article: JournalArticle;
  articleHindi: JournalArticle | null;
}

export default function JournalContent({
  article,
  articleHindi,
}: JournalContentProps) {
  const [language, setLanguage] =
    useState<"en" | "hi">("en");

  const activeArticle =
    language === "hi" && articleHindi
      ? articleHindi
      : article;

  return (
    <>
      {articleHindi && (
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                language === "en"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              English
            </button>

            <button
              onClick={() => setLanguage("hi")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                language === "hi"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      )}

      <h1 className="mb-4 text-5xl font-bold text-blue-900 dark:text-blue-400">
        {activeArticle.title}
      </h1>

      <p className="mb-12 text-xl italic text-slate-600 dark:text-slate-400">
        {activeArticle.subtitle}
      </p>

      {activeArticle.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-8 mt-20 text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-400 md:text-4xl">
            {section.heading}
          </h2>

          {section.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="mb-10 text-justify text-slate-800 dark:text-slate-300"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}