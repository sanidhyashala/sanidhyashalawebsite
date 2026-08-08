import type { JournalMeta } from "../metadata/journalMeta";

export function serializeJournalMeta(
  meta: JournalMeta
): string {
  return `import type { JournalMeta } from "@/app/lib/journal/metadata/journalMeta";

export const meta: JournalMeta = {
  slug: ${JSON.stringify(meta.slug)},

  titleHindi: ${JSON.stringify(meta.titleHindi)},

  titleEnglish: ${JSON.stringify(meta.titleEnglish)},

  description: ${JSON.stringify(meta.description)},

  coverImage: ${JSON.stringify(meta.coverImage)},

  readingTime: ${JSON.stringify(meta.readingTime)},

  categories: ${JSON.stringify(meta.categories)},

  languages: ${JSON.stringify(meta.languages)},

  placements: ${JSON.stringify(meta.placements)},

  featured: ${meta.featured},

  status: ${JSON.stringify(meta.status)},

  createdAt: ${JSON.stringify(meta.createdAt)},

  updatedAt: ${JSON.stringify(meta.updatedAt)},

  livePublishedAt: ${
    meta.livePublishedAt === null
      ? "null"
      : JSON.stringify(meta.livePublishedAt)
  },

  notificationSentAt: ${
    meta.notificationSentAt === null
      ? "null"
      : JSON.stringify(meta.notificationSentAt)
  },

  notificationRecipients: ${meta.notificationRecipients},

  notificationDelivered: ${meta.notificationDelivered},

  notificationFailed: ${meta.notificationFailed},
};
`;
}