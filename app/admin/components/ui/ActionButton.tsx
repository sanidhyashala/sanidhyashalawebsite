"use client";

import type { ButtonHTMLAttributes } from "react";

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger";
}

const styles = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900",

  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800",

  success:
    "bg-emerald-600 text-white hover:bg-emerald-700",

  danger:
    "bg-red-600 text-white hover:bg-red-700",
};

export default function ActionButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`
        inline-flex
        items-center
        justify-center
        rounded-xl
        px-4
        py-2
        text-sm
        font-medium
        transition-all
        duration-200
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${styles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}