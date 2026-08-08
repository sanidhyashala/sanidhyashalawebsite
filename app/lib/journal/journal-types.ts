export interface JournalSection {
  heading: string;
  paragraphs: string[];
}

export interface JournalLanguageContent {
  title: string;
  subtitle: string;
  sections: JournalSection[];
}

export interface JournalMetadata {
  id: string;

  slug: string;

  coverImage: string | null;

  featured: boolean;

  published: boolean;

  publishedAt: string | null;

  createdAt: string;

  updatedAt: string;

  notificationSentAt: string | null;

  notificationRecipients: number | null;

  notificationDelivered: number | null;

  notificationFailed: number | null;
}

export interface Journal {
  metadata: JournalMetadata;

  hindi: JournalLanguageContent;

  english: JournalLanguageContent;
}

export interface JournalCard {
  id: string;

  slug: string;

  title: string;

  subtitle: string;

  coverImage: string | null;

  featured: boolean;

  publishedAt: string | null;
}

export interface CreateJournalInput {
  slug: string;

  coverImage?: string;

  featured?: boolean;

  hindi: JournalLanguageContent;

  english: JournalLanguageContent;
}