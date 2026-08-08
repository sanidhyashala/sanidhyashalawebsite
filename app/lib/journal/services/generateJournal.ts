import { parseJournalContent } from "../parser/articleParser";

import { validateJournal } from "../validation/validateJournal";

import { generateJournalTs } from "../generator/generateJournalTs";
import { generateJournalMeta } from "../generator/generateJournalMeta";
import { generateJournalIndex } from "../generator/generateJournalIndex";

import { generateJournalEntry } from "../generator/generateJournalEntry";

export interface GenerateJournalOptions {
  slug: string;

  hindiContent: string;

  englishContent: string;

  readingTime: string;

  coverImage?: string;

  featured?: boolean;
}

export interface GeneratedJournal {
  slug: string;

  hindiTs: string;

  englishTs: string;

  metaTs: string;

  indexTs: string;

  journalEntryTs: string;

  sourceHindi: string;

  sourceEnglish: string;
}

export async function generateJournal({
  slug,
  hindiContent,
  englishContent,
  readingTime,
  coverImage = "/journal/default-cover.jpg",
  featured = false,
}: GenerateJournalOptions): Promise<GeneratedJournal> {
  /*
  ------------------------------------------
  Parse
  ------------------------------------------
  */

  const hindiArticle =
    parseJournalContent(hindiContent);

  const englishArticle =
    parseJournalContent(englishContent);

  /*
  ------------------------------------------
  Validate
  ------------------------------------------
  */

  const hindiValidation =
    validateJournal(hindiArticle);

  if (!hindiValidation.valid) {
    throw new Error(
      hindiValidation.errors.join("\n")
    );
  }

  const englishValidation =
    validateJournal(englishArticle);

  if (!englishValidation.valid) {
    throw new Error(
      englishValidation.errors.join("\n")
    );
  }

  /*
  ------------------------------------------
  Metadata
  ------------------------------------------
  */

  const finalReadingTime =
  readingTime;

  /*
  ------------------------------------------
  Generate TS
  ------------------------------------------
  */

  const hindiTs =
  generateJournalTs(
    "articleHindi",
    hindiArticle
  );

const englishTs =
  generateJournalTs(
    "articleEnglish",
    englishArticle
  );

  const metaTs =
  generateJournalMeta({
    slug,

    titleHindi:
      hindiArticle.title,

    titleEnglish:
      englishArticle.title,

    description: "",

    coverImage,

    readingTime:
      finalReadingTime,

    categories: [],

    languages: [
      "Hindi",
      "English",
    ],

    placements: [],

    featured,
  });

  const indexTs =
    generateJournalIndex();

    const journalEntryTs =
  generateJournalEntry();

  return {
  slug,

  hindiTs,

  englishTs,

  metaTs,

  indexTs,

  journalEntryTs,

  sourceHindi: hindiContent,

  sourceEnglish: englishContent,
};
}