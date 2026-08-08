export interface JournalFormData {
  slug: string;

  readingTime: string;

  hindi: string;

  english: string;

  wordCount: number;

sectionCount: number;
}

export const emptyJournalForm: JournalFormData = {
  slug: "",
  readingTime: "",
  hindi: "",
  english: "",

  wordCount: 0,
  sectionCount: 0,
};