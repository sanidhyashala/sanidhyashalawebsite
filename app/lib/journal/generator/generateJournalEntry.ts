export function generateJournalEntry() {
  return `import { articleEnglish } from "./articleEnglish";
import { articleHindi } from "./articleHindi";
import { meta } from "./meta";

export const journalEntry = {
  article: articleEnglish,

  articleHindi,

  meta: {
    title: meta.titleEnglish,

    description: meta.description,

    readingTime: meta.readingTime,

    status: meta.status,

    placements: meta.placements,

    languages: meta.languages,

    categories: meta.categories,

    tags: [],

    seoTitle: meta.titleEnglish,

    seoDescription: meta.description,
  },
};
`;
}