export interface SearchResource {
  title: string;
  slug: string;

  className: string;

  category:
    | "notes"
    | "mcq"
    | "pyq"
    | "subjective"
    | "case-based";

  pages?: number;

  premium?: boolean;

  language?: string;

  updated?: string;

  pdf?: string;
}

export interface SearchResult extends SearchResource {
  score: number;
}