export interface PreviewLanguage {
  title: string;

  subtitle: string;

  sections: {
    heading: string;
    paragraphs: string[];
  }[];
}

export interface JournalPreviewData {
  readingTime: string;

  hindi: PreviewLanguage;

  english: PreviewLanguage;
}