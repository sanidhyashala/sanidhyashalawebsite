import { JournalLanguageContent } from "../journal-types";

export function generateJournalTs(
  variableName: string,
  article: JournalLanguageContent
): string {
  return `export const ${variableName} = ${JSON.stringify(
    article,
    null,
    2
  )};\n`;
}