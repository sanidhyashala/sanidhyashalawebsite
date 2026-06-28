"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useSearch } from "@/hooks/useSearch";
import SearchResults from "./SearchResults";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const pathname = usePathname();

  const { results, loading } = useSearch(query);

  // Route change hote hi search reset
  useEffect(() => {
    setQuery("");
  }, [pathname]);

  return (
    <div className="relative w-full max-w-xl">

      <input
        type="text"
        placeholder="Search notes, MCQs, PYQs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
      />

      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          Searching...
        </div>
      )}

      {query.trim() !== "" && (
        <SearchResults
          results={results}
        />
      )}

    </div>
  );
}