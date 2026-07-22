"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";

export default function ScrollButtons() {
  const pathname = usePathname();

const isAdmin =
  pathname.startsWith("/admin");
  const [showTop, setShowTop] =
    useState(false);

  const [showBottom, setShowBottom] =
    useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.scrollY;

      const pageHeight =
        document.documentElement
          .scrollHeight;

      const viewportHeight =
        window.innerHeight;

      setShowTop(scrollY > 400);

      setShowBottom(
        scrollY <
          pageHeight -
            viewportHeight -
            400
      );
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  if (isAdmin) {
  return null;
}

  return (
    <>
      {/* Desktop Theme Toggle */}
      <div className="fixed bottom-8 left-8 z-50 hidden md:block">
        <ThemeToggle />
      </div>

      {/* Scroll Controls */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        {showTop && (
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            aria-label="Scroll to top"
            className="
              group
              flex h-12 w-12 items-center justify-center
              rounded-full
              border border-white/20
              bg-white/10
              backdrop-blur-xl
              shadow-lg
              transition-all duration-300
              hover:-translate-y-1
              hover:scale-105
              hover:bg-white/20
              hover:shadow-xl
            "
          >
            <ChevronUp
              size={20}
              className="
                text-slate-700
                transition-transform duration-300
                group-hover:-translate-y-0.5
              "
            />
          </button>
        )}

        {showBottom && (
          <button
            onClick={() =>
              window.scrollTo({
                top:
                  document
                    .documentElement
                    .scrollHeight,
                behavior: "smooth",
              })
            }
            aria-label="Scroll to bottom"
            className="
              group
              flex h-12 w-12 items-center justify-center
              rounded-full
              border border-white/20
              bg-white/10
              backdrop-blur-xl
              shadow-lg
              transition-all duration-300
              hover:translate-y-1
              hover:scale-105
              hover:bg-white/20
              hover:shadow-xl
            "
          >
            <ChevronDown
              size={20}
              className="
                text-slate-700
                transition-transform duration-300
                group-hover:translate-y-0.5
              "
            />
          </button>
        )}
      </div>
    </>
  );
}