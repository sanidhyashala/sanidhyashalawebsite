import type {
  JournalRegistryItem,
} from "@/app/lib/journal/registry/types";

interface JournalMetaProps {
  journal: JournalRegistryItem;
}

export default function JournalMeta({
  journal,
}: JournalMetaProps) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4

        sm:grid-cols-3
      "
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Reading Time
        </p>

        <p className="mt-1 text-sm font-medium">
          🕒 {journal.readingTime}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Created
        </p>

        <p className="mt-1 text-sm font-medium">
          📅 {journal.createdAt}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Featured
        </p>

        <div className="mt-1">

          {journal.featured ? (

            <span
              className="
                inline-flex
                rounded-full
                bg-yellow-100
                px-3
                py-1
                text-xs
                font-medium
                text-yellow-800

                dark:bg-yellow-900/30
                dark:text-yellow-300
              "
            >
              ⭐ Featured
            </span>

          ) : (

            <span
              className="
                inline-flex
                rounded-full
                bg-slate-100
                px-3
                py-1
                text-xs
                font-medium
                text-slate-700

                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              Standard
            </span>

          )}

        </div>

      </div>

    </div>
  );
}