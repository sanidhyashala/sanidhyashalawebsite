import {
  JournalLanguageContent,
  JournalSection,
} from "../journal-types";

export function parseJournalContent(
  raw: string
): JournalLanguageContent {
  const text = raw.replace(/\r\n/g, "\n").trim();

  const titleMatch = text.match(
    /TITLE:\s*([\s\S]*?)\nSUBTITLE:/i
  );

  if (!titleMatch) {
    throw new Error(
      "TITLE not found."
    );
  }

  const subtitleMatch = text.match(
    /SUBTITLE:\s*([\s\S]*?)\n---/i
  );

  if (!subtitleMatch) {
    throw new Error(
      "SUBTITLE not found."
    );
  }

  const title =
    titleMatch[1].trim();

  const subtitle =
    subtitleMatch[1].trim();

  const body = text.split("---").slice(1);

  const sections: JournalSection[] =
    body.map((section) => {
      const cleaned =
        section.trim();

      const lines =
        cleaned.split("\n");

      const heading =
        lines[0]
          .replace(/^#\s*/, "")
          .trim();

      const paragraphs =
        lines
          .slice(1)
          .join("\n")
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);

      return {
        heading,
        paragraphs,
      };
    });

  return {
    title,
    subtitle,
    sections,
  };
}