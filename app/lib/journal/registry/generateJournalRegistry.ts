import type { JournalRegistryItem } from "./types";

function slugToCamelCase(
  slug: string
) {
  return slug.replace(
    /-([a-z])/g,
    (_, letter) =>
      letter.toUpperCase()
  );
}

export function generateJournalRegistry(
  journals: JournalRegistryItem[]
): string {

  const imports = journals
    .map((journal) => {
      const variableName =
        slugToCamelCase(
          journal.slug
        );

      return `import { meta as ${variableName} } from "./${journal.folder}/meta";`;
    })
    .join("\n");

  const entries = journals
    .map((journal) => {
      const variableName =
        slugToCamelCase(
          journal.slug
        );

      return `  {
    ...${variableName},
    folder: "${journal.folder}",
  }`;
    })
    .join(",\n");

  // 👇 Yahan return block aapki instruction ke hisaab se update kiya gaya hai 👇
  return `${imports}

import type {
  JournalRegistryItem,
} from "@/app/lib/journal/registry/types";

export const journalRegistry: JournalRegistryItem[] = [
${entries}
];
`;
}