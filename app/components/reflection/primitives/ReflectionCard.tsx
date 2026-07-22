import { ReactNode } from "react";

interface ReflectionCardProps {
  children: ReactNode;
  className?: string;
}

export default function ReflectionCard({
  children,
  className = "",
}: ReflectionCardProps) {
  return (
    <article
      className={`
        rounded-[2rem]

        border
        border-slate-200

        bg-white

        p-10
        md:p-12

        shadow-sm

        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-2xl
        hover:shadow-blue-500/10

        dark:border-slate-800
        dark:bg-slate-900

        dark:hover:border-blue-500/40
        dark:hover:shadow-blue-500/10

        ${className}
      `}
    >
      {children}
    </article>
  );
}