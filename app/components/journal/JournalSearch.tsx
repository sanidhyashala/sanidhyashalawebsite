"use client";

import { useMemo, useState } from "react";

import {
  searchJournal,
} from "@/lib/journal-search";

import JournalSearchResults from "./JournalSearchResults";

export default function JournalSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return searchJournal(query);
  }, [query]);

  return (
    <div className="relative mb-10">
      <input
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-400"
      />

      {query.trim() && (
        <JournalSearchResults
          results={results}
        />
      )}
    </div>
  );
}