import {
  getJournalRegistry,
} from "@/app/lib/journal/registry/journalRegistryService";

import JournalCard from "./JournalCard";

export default async function PublishedJournalList() {
  const journals =
    await getJournalRegistry();

  return (
    <section className="space-y-6">

      <div>
        <h2 className="text-2xl font-semibold">
          Published Journals
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          All generated journals available in the project.
        </p>
      </div>

      {journals.length === 0 ? (

        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-slate-300
            p-12
            text-center

            dark:border-slate-700
          "
        >
          <p className="text-slate-500 dark:text-slate-400">
            No journals have been generated yet.
          </p>
        </div>

      ) : (

        <div
          className="
            grid
            gap-6

            lg:grid-cols-2
          "
        >
          {journals.map((journal) => (

            <JournalCard
              key={journal.slug}
              journal={journal}
            />

          ))}
        </div>

      )}

    </section>
  );
}