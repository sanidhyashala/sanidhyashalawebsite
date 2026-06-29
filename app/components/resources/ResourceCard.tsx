import Link from "next/link";
import { ResourceCardProps } from "./resourceTypes";

export default function ResourceCard({
  resource,
  index,
  category,
  className,
}: ResourceCardProps) {
  const readerLink = `/reader/${className}/${category}/${resource.slug}`;

  return (
    <div
      className="
      rounded-2xl
      border
      bg-white
      p-6
      shadow-sm
      transition-all
      duration-300
      hover:-translate-y-1
      hover:shadow-lg
      hover:border-blue-200
    "
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="mb-1 text-sm text-slate-500">
            Chapter {index + 1}
          </p>

          <h2 className="text-2xl font-semibold text-blue-900">
            {resource.title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {resource.pages && (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                📄 {resource.pages} Pages
              </span>
            )}

            {resource.language && (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                🌐 {resource.language}
              </span>
            )}

            {resource.updated && (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                📅 {resource.updated}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {resource.status === "available" && (
            <>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                🟢 Available
              </span>

              <Link
                href={readerLink}
                className="
                rounded-xl
                bg-blue-900
                px-5
                py-2.5
                font-medium
                text-white
                transition
                hover:bg-blue-800
              "
              >
                📖 Read
              </Link>
            </>
          )}

          {resource.status === "coming-soon" && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              🟡 Coming Soon
            </span>
          )}

          {resource.status === "locked" && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              🔒 Premium
            </span>
          )}
        </div>
      </div>
    </div>
  );
}