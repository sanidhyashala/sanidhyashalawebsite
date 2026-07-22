interface Props {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info";
}

const styles = {
  default:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",

  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",

  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",

  danger:
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",

  info:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
};

export default function Badge({
  children,
  variant = "default",
}: Props) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        tracking-wide
        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
}