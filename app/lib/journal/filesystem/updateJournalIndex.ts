import { promises as fs } from "fs";
import path from "path";

export async function updateJournalIndex() {
  const journalRoot = path.resolve(
    process.cwd(),
    "app/content/journal"
  );

  const entries =
    await fs.readdir(
      journalRoot,
      {
        withFileTypes: true,
      }
    );

  const journals =
    entries.filter(
      (entry) =>
        entry.isDirectory()
    );

  const imports = journals
    .map(
      (journal, index) =>
        `import { meta as meta${index} } from "./${journal.name}/meta";`
    )
    .join("\n");

  const file = `
${imports}

export const journals = [
${journals
  .map(
    (_, index) =>
      `  meta${index},`
  )
  .join("\n")}
];
`;

  await fs.writeFile(
    path.join(
      journalRoot,
      "journal-index.ts"
    ),
    file,
    "utf8"
  );
}