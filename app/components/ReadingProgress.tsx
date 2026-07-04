"use client";

import { useEffect, useRef, useState } from "react";

export default function ReadingProgress() {
  const [width, setWidth] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) return;

      rafId.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;

        const docHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;

        const rawProgress =
          docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        const progress = Math.min(100, Math.max(0, rawProgress));

        setWidth(progress);
        rafId.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-[width] duration-150 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}