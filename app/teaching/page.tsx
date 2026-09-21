"use client";

import { useState } from "react";

import ArticleLayout from "@/app/components/ArticleLayout";
import { teaching } from "@/content/teaching/teaching";

type Language = "en" | "hi";

export default function TeachingPage() {
  const [language, setLanguage] =
    useState<Language>("en");

  const active = teaching[language];

  return (
    <ArticleLayout
      title={active.title}
      subtitle={active.subtitle}
      type="teaching"
    >
      <>
        {/* Language Switcher */}
        <div className="mb-10 flex">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                language === "en"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              English
            </button>

            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                language === "hi"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Active Language Sections */}
        {active.sections.map((section) => (
          <section key={section.heading}>
            <h2
              className="
                mb-6
                mt-16
                text-3xl
                font-bold
                leading-tight
                tracking-tight
                text-blue-900
                dark:text-blue-400
                md:text-4xl
              "
            >
              {section.heading}
            </h2>

            {section.paragraphs.map(
              (paragraph, index) => (
                <p
                  key={index}
                  className="
                    mb-6
                    text-justify
                    text-[17px]
                    leading-8
                    text-slate-800
                    dark:text-slate-300
                    md:text-lg
                  "
                >
                  {paragraph}
                </p>
              )
            )}
          </section>
        ))}
      </>
    </ArticleLayout>
  );
}