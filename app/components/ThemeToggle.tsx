"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } =
    useTheme();

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark =
    resolvedTheme === "dark";

  return (
    <button
      onClick={() =>
        setTheme(
          isDark ? "light" : "dark"
        )
      }
      aria-label="Toggle theme"
      className="
        relative
        h-11
        w-11
        overflow-hidden
        rounded-2xl

        border
        border-slate-200/80

        bg-white/70
        backdrop-blur-xl

        shadow-[0_4px_20px_rgba(0,0,0,0.08)]

        transition-all
        duration-300

        hover:-translate-y-0.5
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]

        dark:border-slate-700/80
        dark:bg-slate-900/70
        dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]
      "
    >
      <div
        className={`
          absolute inset-0
          flex items-center justify-center
          transition-all duration-500

          ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }
        `}
      >
        <Sun
          size={18}
          className="
            text-amber-400
          "
        />
      </div>

      <div
        className={`
          absolute inset-0
          flex items-center justify-center
          transition-all duration-500

          ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }
        `}
      >
        <Moon
          size={18}
          className="
            text-slate-700
            dark:text-slate-300
          "
        />
      </div>
    </button>
  );
}