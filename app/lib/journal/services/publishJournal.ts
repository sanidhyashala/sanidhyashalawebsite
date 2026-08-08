import { readJournalMeta } from "../filesystem/readJournalMeta";
import { writeJournalMeta } from "../filesystem/writeJournalMeta";

import { updateJournalRegistry } from "../registry/updateJournalRegistry";

export async function publishJournal(
  slug: string
) {
  const meta = await readJournalMeta(slug);

  if (meta.status === "published") {
    throw new Error("Journal is already published.");
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  await writeJournalMeta({
    ...meta,

    status: "published",

    updatedAt: today,

    livePublishedAt: today,
  });

  await updateJournalRegistry();

  return true;
}