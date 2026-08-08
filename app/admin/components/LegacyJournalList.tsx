import {
  journalArticles,
} from "@/content/journal";

import LegacyJournalCard from "./LegacyJournalCard";

import { readLegacyNotificationRegistry } from "@/app/lib/journal/filesystem/readLegacyNotificationRegistry";

export default async function LegacyJournalList() {
  const notificationRegistry =
    await readLegacyNotificationRegistry();

  const journals =
    Object.entries(
      journalArticles
    );

  return (
    <section className="space-y-6">

      <div>

        <h2 className="text-2xl font-semibold">
          Legacy Journals
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Previously published journals from the legacy publishing system.
        </p>

      </div>

      <div
        className="
          grid
          gap-6

          lg:grid-cols-2
        "
      >
        {journals.map(
          ([slug, journal]) => (

            <LegacyJournalCard
  key={slug}
  slug={slug}
  journal={journal}
  notification={
    notificationRegistry[slug] ?? {
      notificationSentAt: null,
      recipients: 0,
      delivered: 0,
      failed: 0,
    }
  }
/>

          )
        )}
      </div>

    </section>
  );
}