"use client";

import { heroContent } from "@/app/reflection/data/hero";

export default function Hero() {
  const handleScroll = () => {
    const nextSection = document.getElementById("quiet-introduction");

    if (nextSection) {
      nextSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      className="flex min-h-screen items-center justify-center px-6"
      aria-labelledby="reflection-title"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">

        <h1
          id="reflection-title"
          className="text-5xl font-semibold tracking-tight text-blue-900 dark:text-blue-400 md:text-6xl"
        >
          {heroContent.title}
        </h1>

        <p className="mt-8 whitespace-pre-line text-xl leading-relaxed text-slate-600 dark:text-slate-400">
          {heroContent.subtitle}
        </p>

        <button
          onClick={handleScroll}
          className="
mt-20
flex
flex-col
items-center
gap-2
text-slate-500
transition-colors
duration-300
hover:text-blue-700
dark:text-slate-500
dark:hover:text-blue-400
"
        >
          <span className="text-2xl">↓</span>

          <span className="text-sm tracking-[0.2em] uppercase">
            {heroContent.invitation}
          </span>
        </button>

      </div>
    </section>
  );
}