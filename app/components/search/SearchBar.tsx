"use client";

import { useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import SearchResults from "./SearchResults";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const { results, loading } = useSearch(query);

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
        <div className="absolute right-4 top-3 text-sm text-slate-500">
          Searching...
        </div>
      )}

      <SearchResults results={results} />
    </div>
  );
}