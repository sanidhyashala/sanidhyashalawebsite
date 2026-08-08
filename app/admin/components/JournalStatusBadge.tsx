import type {
  JournalStatus,
} from "@/app/lib/journal/metadata/journalMeta";

interface JournalStatusBadgeProps {
  status: JournalStatus;
}

const statusStyles = {
  generated:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",

  published:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",

  archived:
    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
} satisfies Record<JournalStatus, string>;

export default function JournalStatusBadge({
  status,
}: JournalStatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        capitalize
        ${statusStyles[status]}
      `}
    >
      {status}
    </span>
  );
}