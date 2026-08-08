import fs from "fs/promises";
import path from "path";

import type {
  JournalIndexItem,
} from "./journalIndex.types";

const INDEX_PATH = path.join(
  process.cwd(),
  "content",
  "journal",
  "journal-index.json"
);

async function ensureIndexExists() {
  try {
    await fs.access(INDEX_PATH);
  } catch {
    await fs.mkdir(
      path.dirname(INDEX_PATH),
      { recursive: true }
    );

    await fs.writeFile(
      INDEX_PATH,
      "[]",
      "utf8"
    );
  }
}

export async function readJournalIndex(): Promise<
  JournalIndexItem[]
> {
  await ensureIndexExists();

  const raw =
    await fs.readFile(
      INDEX_PATH,
      "utf8"
    );

  return JSON.parse(raw);
}

export async function writeJournalIndex(
  journals: JournalIndexItem[]
) {
  await fs.writeFile(
    INDEX_PATH,
    JSON.stringify(
      journals,
      null,
      2
    ),
    "utf8"
  );
}

export async function updateJournalIndex(
  journal: JournalIndexItem
) {
  const journals =
    await readJournalIndex();

  const filtered =
    journals.filter(
      (item) =>
        item.slug !== journal.slug
    );

  filtered.unshift(journal);

  await writeJournalIndex(
    filtered
  );
}