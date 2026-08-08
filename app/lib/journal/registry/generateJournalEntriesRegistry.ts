import type {
  JournalRegistryItem,
} from "./types";

function slugToCamelCase(
  slug: string
) {
  return slug.replace(
    /-([a-z])/g,
    (_, letter) =>
      letter.toUpperCase()
  );
}

export function generateJournalEntriesRegistry(
  journals: JournalRegistryItem[]
): string {

  const imports = journals
    .map((journal) => {
      const variableName =
        slugToCamelCase(
          journal.slug
        );

      return `import { journalEntry as ${variableName} } from "./${journal.folder}/journalEntry";`;
    })
    .join("\n");

  const entries = journals
    .map((journal) => {
      const variableName =
        slugToCamelCase(
          journal.slug
        );

      return `  "${journal.slug}": ${variableName}`;
    })
    .join(",\n");

  const importBlock = imports
    ? `${imports}\n\n`
    : "";

  return `${importBlock}import type {
  JournalEntry,
} from "@/content/journal/types";

export const generatedJournalEntries: Record<
  string,
  JournalEntry
> = {
${entries}
};
`;
}