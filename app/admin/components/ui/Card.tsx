import type { ReactNode } from "react";

interface Props {
  children: ReactNode;

  className?: string;

  hover?: boolean;

  padding?: "none" | "sm" | "md" | "lg";

  border?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = true,
  padding = "lg",
  border = true,
}: Props) {
  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding];

  return (
    <div
      className={[
        "rounded-3xl",
        "bg-white",
        "dark:bg-slate-900",

        border &&
          "border border-slate-200 dark:border-slate-800",

        "shadow-sm",

        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",

        paddingClass,

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}