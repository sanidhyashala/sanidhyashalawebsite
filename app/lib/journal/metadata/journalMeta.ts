export type JournalStatus =
  | "generated"
  | "published"
  | "archived";

export interface JournalMeta {
  slug: string;

  titleHindi: string;

  titleEnglish: string;

  description: string;

  coverImage: string;

  readingTime: string;

  categories: string[];

  languages: ("Hindi" | "English")[];

  placements: (
    | "featured"
    | "editors-choice"
    | "most-curious"
    | "staff-pick"
    | "recommended"
  )[];

  featured: boolean;

  status: JournalStatus;

  createdAt: string;

  updatedAt: string;

  livePublishedAt: string | null;

  /*
  ----------------------------------------
  SEO & Content Stats
  ----------------------------------------
  */
  wordCount?: number; // ⭐ Ye add ho gaya SEO ke liye!

  /*
  ----------------------------------------
  Notification History
  ----------------------------------------
  */
  notificationSentAt: string | null;

  notificationRecipients: number;

  notificationDelivered: number;

  notificationFailed: number;
}