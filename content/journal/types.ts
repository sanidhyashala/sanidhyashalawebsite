export type Language =
  | "English"
  | "Hindi";

export type ArticlePlacement =
  | "featured"
  | "editors-choice"
  | "most-curious"
  | "staff-pick"
  | "recommended";

export type ArticleStatus =
  | "generated"
  | "published"
  | "archived";

export interface JournalMeta {
  title: string;

  description: string;

  readingTime: string;

  status: ArticleStatus;

  placements?: ArticlePlacement[];

  languages: Language[];

  categories: string[];

  tags: string[];

  seoTitle: string;

  seoDescription: string;
}

export interface JournalSection {
  heading: string;

  paragraphs: string[];
}

export interface JournalArticle {
  title: string;

  subtitle: string;

  sections: JournalSection[];
}

export interface JournalEntry {
  article: JournalArticle;

  articleHindi: JournalArticle | null;

  meta: JournalMeta;
}