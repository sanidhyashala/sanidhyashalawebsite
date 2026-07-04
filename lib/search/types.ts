export type SearchCategory =
  | "notes"
  | "mcq"
  | "pyq"
  | "subjective"
  | "case-based";

export interface SearchMetadata {
  pages?: number;
  premium?: boolean;
  language?: string;
  updated?: string;
  pdf?: string;
}

export interface SearchResource extends SearchMetadata {
  readonly title: string;
  readonly slug: string;
  readonly className: string;
  readonly category: SearchCategory;
}

export interface SearchResult extends SearchResource {
  readonly score: number;
}