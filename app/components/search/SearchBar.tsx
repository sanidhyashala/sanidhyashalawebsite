"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Search, CircleX, Loader2 } from "lucide-react";

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

  // Memoized handlers to prevent unnecessary re-renders
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative flex items-center w-full">
        {/* Search Icon */}
        <Search
          className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />

        {/* Input */}
        <input
          type="text"
          placeholder="Search notes, MCQs, PYQs..."
          value={query}
          onChange={handleChange}
          aria-label="Search resources"
          autoComplete="off"
          spellCheck={false}
          role="searchbox"
          className="w-full min-h-[48px] rounded-xl border border-slate-300 pl-11 pr-12 py-3 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:shadow-sm"
        />

        {/* Dynamic Right Side: Loader or Clear Button */}
        <div className="absolute right-3 flex items-center justify-center">
          {loading ? (
            <Loader2 
              className="h-5 w-5 animate-spin text-slate-400" 
              aria-hidden="true" 
            />
          ) : (
            hasQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="flex items-center justify-center rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <CircleX className="h-5 w-5" aria-hidden="true" />
              </button>
            )
          )}
        </div>
      </div>

      {hasQuery && (
        <SearchResults results={results} />
      )}
    </div>
  );
}