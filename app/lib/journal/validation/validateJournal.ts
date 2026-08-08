import { JournalLanguageContent } from "../journal-types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJournal(
  article: JournalLanguageContent
): ValidationResult {
  const errors: string[] = [];

  if (!article.title.trim()) {
    errors.push("Title is missing.");
  }

  if (!article.subtitle.trim()) {
    errors.push("Subtitle is missing.");
  }

  if (article.sections.length === 0) {
    errors.push("No sections found.");
  }

  article.sections.forEach((section, index) => {
    if (!section.heading.trim()) {
      errors.push(
        `Section ${index + 1} has no heading.`
      );
    }

    if (section.paragraphs.length === 0) {
      errors.push(
        `Section ${index + 1} has no paragraphs.`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}