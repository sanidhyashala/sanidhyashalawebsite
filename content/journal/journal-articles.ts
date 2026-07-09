import {
  article as mathematics,
} from "./why-mathematics-is-more-than-numbers";

import {
  articleHindi as mathematicsHindi,
} from "./why-mathematics-is-more-than-numbers-hi";

import {
  article as universe,
} from "./when-the-language-of-the-universe-falls-silent";

import {
  articleHindi as universeHindi,
} from "./when-the-language-of-the-universe-falls-silent-hi";

import type { JournalEntry } from "./types";

export const journalArticles: Record<
  string,
  JournalEntry
> = {
  "why-mathematics-is-more-than-numbers": {
    article: mathematics,

    articleHindi: mathematicsHindi,

    meta: {
      title:
        "Why Mathematics is More Than Numbers",

      description:
        "Exploring how mathematics teaches us to think, question and discover patterns in life.",

      readingTime: "10 min read",

      featured: false,

      languages: [
  "English",
  "Hindi",
],

      categories: [
        "Mathematics",
        "Education",
      ],

      tags: [
        "Learning",
        "Logic",
        "Thinking",
        "Reality",
        "Patterns",
      ],

      seoTitle:
        "Why Mathematics is More Than Numbers | Sanidhyashala",

      seoDescription:
        "Mathematics is not merely a subject. It is one of humanity's deepest attempts to understand reality.",
    },
  },

  "when-the-language-of-the-universe-falls-silent": {
    article: universe,

    articleHindi: universeHindi,

    meta: {
      title:
        "When the Language of the Universe Falls Silent",

      description:
        "Is mathematics discovered or invented? A journey through philosophy, science and the search for truth.",

      readingTime: "18 min read",

      featured: true,

      languages: [
        "English",
        "Hindi",
      ],

      categories: [
        "Mathematics",
        "Philosophy",
      ],

      tags: [
        "Plato",
        "Truth",
        "Reality",
        "Consciousness",
        "Discovery",
        "Invention",
      ],

      seoTitle:
        "When the Language of the Universe Falls Silent | Sanidhyashala",

      seoDescription:
        "Is mathematics discovered or invented? A journey through philosophy, science and the search for truth.",
    },
  },
};