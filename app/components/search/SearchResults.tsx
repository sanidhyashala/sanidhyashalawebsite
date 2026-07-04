"use client";

import Link from "next/link";
import { SearchResult } from "@/lib/search";
import { FileText } from "lucide-react";

interface Props {
  results: SearchResult[];
  onSelect?: () => void;
}

export default function SearchResults({
  results,
  onSelect,
}: Props) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div
      // 7. Accessibility
      role="listbox"
      aria-label="Search Results"
      // 5. Improve Dropdown Container (Max height, smooth scrolling, thin scrollbar)
      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl scroll-smooth [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
    >
      {results.map((item) => (
        <Link
          key={`${item.className}-${item.category}-${item.slug}`}
          href={`/learning/${item.className}/${item.category}`}
          onClick={() => onSelect?.()}
          // 3. Improve Hover State (stronger bg, blue accent, transition, pointer)
          className="block cursor-pointer border-b border-l-2 border-transparent border-b-slate-100 bg-white px-4 py-3 transition-all duration-200 ease-in-out hover:border-l-blue-500 hover:bg-slate-50 last:border-b-0"
        >
          <div className="flex items-center gap-2">
            {/* 2. Add Icons for each result */}
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            {/* 6. Better Typography (slightly darker, semibold) */}
            <div className="truncate font-semibold text-slate-900">
              {item.title}
            </div>
          </div>
          {/* 4. Improve Metadata Row & 6. Typography */}
          <div className="mt-2 flex items-center gap-2 pl-6">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {item.className.replace("-", " ").toUpperCase()}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
              {item.category}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}