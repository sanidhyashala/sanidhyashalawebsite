import Link from "next/link";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

export default function DashboardCard({
  title,
  description,
  href,
  icon,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="
        group
        block
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-8
        shadow-sm
        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-slate-300
        hover:shadow-lg

        dark:border-slate-800
        dark:bg-slate-900
        dark:hover:border-slate-700
      "
    >
      <div className="flex items-center gap-4">

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-slate-100
            text-2xl

            dark:bg-slate-800
          "
        >
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>

      </div>
    </Link>
  );
}