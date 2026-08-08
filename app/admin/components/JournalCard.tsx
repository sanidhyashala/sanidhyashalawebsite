import type { JournalRegistryItem } from "@/app/lib/journal/registry/types";

import JournalStatusBadge from "./JournalStatusBadge";
import JournalMeta from "./JournalMeta";
import JournalActions from "./JournalActions";

interface JournalCardProps {
  journal: JournalRegistryItem;
}

export default function JournalCard({
  journal,
}: JournalCardProps) {
  return (
    <article
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
        transition-all

        hover:shadow-md

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* Header */}

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <h3
            className="
              text-lg
              font-semibold
              break-words
            "
          >
            {journal.titleEnglish}
          </h3>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              break-all

              dark:text-slate-400
            "
          >
            {journal.slug}
          </p>

        </div>

        <JournalStatusBadge
          status={journal.status}
        />

      </div>

      {/* Divider */}

      <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

      {/* Metadata */}

      <JournalMeta
        journal={journal}
      />

      {/* Divider */}

      <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

      {/* Actions */}

      <JournalActions
  journal={journal}
/>

    </article>
  );
}