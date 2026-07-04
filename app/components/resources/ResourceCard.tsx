import Link from "next/link";
import {
  FileText,
  Languages,
  CalendarDays,
  BookOpen,
  CheckCircle2,
  Clock3,
  Lock,
} from "lucide-react";
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
      p-5 md:p-6
      shadow-sm
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-blue-300
      hover:shadow-xl
      focus-within:ring-2
      focus-within:ring-blue-300
      focus-within:ring-offset-2
    "
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Chapter {index + 1}
          </p>

          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
            {resource.title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {resource.pages && (
              <span
                className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-slate-200
                bg-slate-50
                px-3
                py-1
                text-slate-600
              "
              >
                <FileText className="h-3.5 w-3.5" />
                {resource.pages} Pages
              </span>
            )}

            {resource.language && (
              <span
                className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-slate-200
                bg-slate-50
                px-3
                py-1
                text-slate-600
              "
              >
                <Languages className="h-3.5 w-3.5" />
                {resource.language}
              </span>
            )}

            {resource.updated && (
              <span
                className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-slate-200
                bg-slate-50
                px-3
                py-1
                text-slate-600
              "
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {resource.updated}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {resource.status === "available" && (
            <>
              <span
                className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-green-50
                px-3
                py-1
                text-sm
                font-medium
                text-green-700
              "
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Available
              </span>

              <Link
                href={readerLink}
                className="
                inline-flex
                h-11
                items-center
                gap-2
                rounded-xl
                bg-blue-900
                px-5
                font-medium
                text-white
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-blue-800
                hover:shadow-lg
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue-400
                focus-visible:ring-offset-2
              "
              >
                <BookOpen className="h-4 w-4" />
                Read
              </Link>
            </>
          )}

          {resource.status === "coming-soon" && (
            <span
              className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-amber-50
              px-3
              py-1
              text-sm
              font-medium
              text-amber-700
            "
            >
              <Clock3 className="h-3.5 w-3.5" />
              Coming Soon
            </span>
          )}

          {resource.status === "locked" && (
            <span
              className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-red-50
              px-3
              py-1
              text-sm
              font-medium
              text-red-700
            "
            >
              <Lock className="h-3.5 w-3.5" />
              Premium
            </span>
          )}
        </div>
      </div>
    </div>
  );
}