import Link from "next/link";
import { SearchResult } from "@/lib/search";

interface Props {
  results: SearchResult[];
}

export default function SearchResults({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
      {results.map((item) => (
        <Link
          key={`${item.className}-${item.category}-${item.slug}`}
          href={`/learning/${item.className}/${item.category}`}
          className="block border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
        >
          <div className="font-semibold text-slate-900">
            {item.title}
          </div>

          <div className="text-sm text-slate-500">
            {item.className.replace("-", " ").toUpperCase()} •{" "}
            {item.category}
          </div>
        </Link>
      ))}
    </div>
  );
}