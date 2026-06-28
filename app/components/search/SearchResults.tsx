"use client";

import Link from "next/link";
import { SearchResult } from "@/lib/search";

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
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

      {results.map((item) => (

        <Link
          key={`${item.className}-${item.category}-${item.slug}`}
          href={`/learning/${item.className}/${item.category}`}
          onClick={() => onSelect?.()}
          className="block border-b px-4 py-3 hover:bg-slate-50 last:border-none"
        >

          <div className="font-medium text-blue-900">
            {item.title}
          </div>

          <div className="mt-1 text-xs text-slate-500">

            {item.className.replace("-", " ").toUpperCase()}

            {" • "}

            {item.category}

          </div>

        </Link>

      ))}

    </div>
  );
}