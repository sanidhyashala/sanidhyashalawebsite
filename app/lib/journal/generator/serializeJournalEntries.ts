import type { JournalRegistryItem } from "../registry/types";

function slugToCamelCase(
  slug: string
) {
  return slug.replace(
    /-([a-z])/g,
    (_, letter) =>
      letter.toUpperCase()
  );
}

export function serializeJournalEntries(
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

  // 👇 Yahan return block aapki instruction ke hisaab se update kiya gaya hai 👇
  return `${imports}

import type {
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